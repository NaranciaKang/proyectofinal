from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core import mail
from django.test import TestCase
from django.urls import reverse

from .models import Carrito, DetalleOrdenCompra, ItemCarrito, OrdenCompra, Producto


def crear_producto(**kwargs):
    datos = dict(nombre="Reloj de prueba", descripcion="desc", precio=Decimal("50000"), categoria="H", stock=5)
    datos.update(kwargs)
    return Producto.objects.create(**datos)


class CarritoOwnershipTests(TestCase):
    """C1: nadie debe poder tocar el carrito de otra sesión (IDOR)."""

    def setUp(self):
        self.producto = crear_producto()
        self.usuario = User.objects.create_user(username="ana", email="ana@test.com", password="ClaveSegura123")

    def test_sesion_ajena_no_puede_eliminar_item(self):
        self.client.login(username="ana", password="ClaveSegura123")
        self.client.post(reverse("agregar_al_carrito", args=[self.producto.id]))
        item = ItemCarrito.objects.get(carrito__usuario=self.usuario)

        otro_cliente = self.client_class()
        respuesta = otro_cliente.post(reverse("eliminar_item"), {"item_id": item.id})

        self.assertEqual(respuesta.json(), {"success": False, "error": "Item no encontrado"})
        self.assertTrue(ItemCarrito.objects.filter(id=item.id).exists())

    def test_sesion_ajena_no_puede_actualizar_cantidad(self):
        self.client.login(username="ana", password="ClaveSegura123")
        self.client.post(reverse("agregar_al_carrito", args=[self.producto.id]))
        item = ItemCarrito.objects.get(carrito__usuario=self.usuario)

        otro_cliente = self.client_class()
        otro_cliente.post(reverse("actualizar_cantidad"), {"item_id": item.id, "cantidad": 99})

        item.refresh_from_db()
        self.assertEqual(item.cantidad, 1)


class CarritoAnonimoAisladoTests(TestCase):
    """A2: dos visitantes anónimos no deben compartir carrito."""

    def test_dos_sesiones_anonimas_no_comparten_carrito(self):
        producto = crear_producto()
        cliente_1 = self.client_class()
        cliente_2 = self.client_class()

        cliente_1.post(reverse("agregar_al_carrito", args=[producto.id]))

        self.assertEqual(Carrito.objects.filter(usuario__isnull=True).count(), 1)
        respuesta = cliente_2.get(reverse("ver_carrito"))
        self.assertEqual(len(respuesta.context["items"]), 0)


class StockTests(TestCase):
    """A1: no se puede comprar más unidades de las que hay en stock."""

    def setUp(self):
        self.producto = crear_producto(stock=2)
        self.usuario = User.objects.create_user(username="bruno", email="bruno@test.com", password="ClaveSegura123")
        self.client.login(username="bruno", password="ClaveSegura123")

    def test_agregar_al_carrito_no_supera_el_stock(self):
        for _ in range(5):
            self.client.post(reverse("agregar_al_carrito", args=[self.producto.id]))

        item = ItemCarrito.objects.get(producto=self.producto)
        self.assertEqual(item.cantidad, 2)

    def test_actualizar_cantidad_se_limita_al_stock(self):
        self.client.post(reverse("agregar_al_carrito", args=[self.producto.id]))
        item = ItemCarrito.objects.get(producto=self.producto)

        self.client.post(reverse("actualizar_cantidad"), {"item_id": item.id, "cantidad": 999})

        item.refresh_from_db()
        self.assertEqual(item.cantidad, 2)

    def test_checkout_bloquea_si_no_alcanza_el_stock(self):
        self.client.post(reverse("agregar_al_carrito", args=[self.producto.id]))
        self.client.post(reverse("agregar_al_carrito", args=[self.producto.id]))
        # El carrito quedó con 2 unidades; ahora el stock disponible baja a 1.
        self.producto.stock = 1
        self.producto.save()

        respuesta = self.client.post(reverse("checkout"), {"direccion": "Calle 1", "comuna": "Providencia"})

        self.assertEqual(respuesta.status_code, 302)
        self.assertEqual(respuesta.url, reverse("ver_carrito"))
        self.assertFalse(OrdenCompra.objects.exists())


class CheckoutTests(TestCase):
    """C5/C6/C8: checkout único, exige login y valida los campos de envío."""

    def setUp(self):
        self.producto = crear_producto(stock=10, precio=Decimal("20000"))
        self.usuario = User.objects.create_user(username="carla", email="carla@test.com", password="ClaveSegura123")

    def test_checkout_requiere_login(self):
        respuesta = self.client.get(reverse("checkout"))
        self.assertRedirects(respuesta, reverse("login"))

    def test_checkout_valida_campos_de_envio(self):
        self.client.login(username="carla", password="ClaveSegura123")
        self.client.post(reverse("agregar_al_carrito", args=[self.producto.id]))

        respuesta = self.client.post(reverse("checkout"), {"direccion": "", "comuna": ""})

        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(OrdenCompra.objects.exists())

    @patch("principal.views.tx")
    def test_checkout_crea_snapshot_de_la_orden(self, tx_mock):
        """A4: el detalle de la orden se guarda al momento del checkout, no del pago."""
        tx_mock.create.return_value = {"token": "token-de-prueba", "url": "https://webpay.test/"}
        self.client.login(username="carla", password="ClaveSegura123")
        self.client.post(reverse("agregar_al_carrito", args=[self.producto.id]))

        respuesta = self.client.post(reverse("checkout"), {"direccion": "Calle 1", "comuna": "Providencia"})

        self.assertEqual(respuesta.status_code, 200)
        orden = OrdenCompra.objects.get()
        self.assertEqual(orden.detalles.count(), 1)
        detalle = orden.detalles.first()
        self.assertEqual(detalle.nombre_producto, self.producto.nombre)
        self.assertEqual(detalle.cantidad, 1)
        self.assertEqual(detalle.precio_unitario, self.producto.precio)


class WebpayReturnTests(TestCase):
    """A4: el pago exitoso descuenta stock y arma la boleta desde el snapshot."""

    def setUp(self):
        self.producto = crear_producto(stock=5, precio=Decimal("10000"))
        self.usuario = User.objects.create_user(username="dario", email="dario@test.com", password="ClaveSegura123")
        self.carrito = Carrito.objects.create(usuario=self.usuario)
        self.orden = OrdenCompra.objects.create(
            usuario=self.usuario, carrito=self.carrito, total=Decimal("20000"),
            direccion="Calle 1", comuna="Providencia", estado="pendiente",
            token_transbank="token-test",
        )
        DetalleOrdenCompra.objects.create(
            orden=self.orden, producto=self.producto, nombre_producto=self.producto.nombre,
            cantidad=2, precio_unitario=self.producto.precio,
        )
        ItemCarrito.objects.create(carrito=self.carrito, producto=self.producto, cantidad=2)

    @patch("principal.views.tx")
    def test_pago_autorizado_descuenta_stock_y_envia_boleta(self, tx_mock):
        tx_mock.commit.return_value = {"status": "AUTHORIZED"}

        respuesta = self.client.get(reverse("webpay_return"), {"token_ws": "token-test"})

        self.assertEqual(respuesta.status_code, 200)
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.stock, 3)
        self.orden.refresh_from_db()
        self.assertEqual(self.orden.estado, "pagado")
        self.assertEqual(len(mail.outbox), 1)
        self.assertFalse(ItemCarrito.objects.filter(carrito=self.carrito).exists())


class RegistroLoginTests(TestCase):
    """C6/A7: email único y contraseña validada al registrarse."""

    def test_registro_rechaza_email_duplicado(self):
        User.objects.create_user(username="user1", email="dup@test.com", password="ClaveSegura123")

        self.client.post(reverse("registro"), {
            "username": "user2", "email": "dup@test.com", "password": "OtraClave123",
        })

        self.assertEqual(User.objects.filter(email="dup@test.com").count(), 1)

    def test_registro_rechaza_contrasena_debil(self):
        self.client.post(reverse("registro"), {
            "username": "user3", "email": "user3@test.com", "password": "123",
        })

        self.assertFalse(User.objects.filter(username="user3").exists())

    def test_registro_exitoso_redirige_a_login(self):
        respuesta = self.client.post(reverse("registro"), {
            "username": "user4", "email": "user4@test.com", "password": "ClaveSegura123",
        })

        self.assertRedirects(respuesta, reverse("login"))
        self.assertTrue(User.objects.filter(username="user4").exists())

    def test_login_con_correo_inexistente_no_falla(self):
        respuesta = self.client.post(reverse("login"), {"email": "nadie@test.com", "password": "x"})
        self.assertEqual(respuesta.status_code, 200)


class InventarioTests(TestCase):
    """C2: /inventario/ solo accesible para staff."""

    def test_requiere_staff(self):
        respuesta = self.client.get(reverse("inventario"))
        self.assertEqual(respuesta.status_code, 302)
        self.assertIn("/admin/login/", respuesta.url)

    def test_staff_puede_crear_producto_con_stock(self):
        User.objects.create_user(
            username="admin2", email="admin2@test.com", password="ClaveSegura123", is_staff=True,
        )
        self.client.login(username="admin2", password="ClaveSegura123")

        self.client.post(reverse("inventario"), {
            "nombre": "Nuevo", "descripcion": "d", "precio": "1000", "categoria": "M", "stock": "9",
        })

        producto = Producto.objects.get(nombre="Nuevo")
        self.assertEqual(producto.stock, 9)
        self.assertEqual(producto.categoria, "M")


class ContactoTests(TestCase):
    """A3: el formulario de contacto envía el correo de verdad."""

    def test_envio_exitoso(self):
        respuesta = self.client.post(
            reverse("contacto"),
            {"nombre": "Elena", "email": "elena@test.com", "mensaje": "Hola"},
            HTTP_X_REQUESTED_WITH="XMLHttpRequest",
        )

        self.assertEqual(respuesta.json(), {"success": True})
        self.assertEqual(len(mail.outbox), 1)

    def test_rechaza_campos_vacios(self):
        respuesta = self.client.post(
            reverse("contacto"),
            {"nombre": "", "email": "", "mensaje": ""},
            HTTP_X_REQUESTED_WITH="XMLHttpRequest",
        )

        self.assertFalse(respuesta.json()["success"])
        self.assertEqual(len(mail.outbox), 0)


class SeoTests(TestCase):
    """M1: robots.txt y sitemap.xml deben existir."""

    def test_robots_txt(self):
        respuesta = self.client.get("/robots.txt")
        self.assertEqual(respuesta.status_code, 200)
        self.assertIn(b"Sitemap:", respuesta.content)

    def test_sitemap_xml(self):
        respuesta = self.client.get("/sitemap.xml")
        self.assertEqual(respuesta.status_code, 200)
