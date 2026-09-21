from django.shortcuts import render, redirect, get_object_or_404
from .models import Producto, Carrito, ItemCarrito, Wishlist, ItemWishlist
from django.http import JsonResponse, HttpResponse
from .forms import ProductoForm
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm
from django.contrib.auth.tokens import default_token_generator
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.views.decorators.http import require_POST
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from transbank.webpay.webpay_plus.transaction import Transaction, WebpayOptions
from django.conf import settings
from .models import OrdenCompra
import uuid

from .utils import enviar_boleta_email


@staff_member_required
def principal(request):
    if request.method == 'POST':
        form = ProductoForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('inventario')  # evita reenvío del form
    else:
        form = ProductoForm()

    productos = Producto.objects.all().order_by('-id')
    return render(request, 'principal/index.html', {
        'form': form,
        'productos': productos,
    })

def inicio(request):
    productos_carrusel = Producto.objects.all().order_by('-id')[:3]  # solo 3 últimos para el carrusel
    productos_lista = Producto.objects.all().order_by('-id')[:8]     # últimos 8 para la sección de productos

    wishlist_ids = []
    if request.user.is_authenticated:
        wishlist = obtener_wishlist(request)
        wishlist_ids = list(wishlist.items.values_list('producto_id', flat=True))

    # Agregamos un atributo 'en_wishlist' a cada producto
    for p in productos_lista:
        p.en_wishlist = p.id in wishlist_ids

    return render(request, 'principal/inicio.html', {
        'productos_carrusel': productos_carrusel,
        'productos_lista': productos_lista,
        'wishlist_ids': wishlist_ids
    })


    

#-------------------------------

# Vista de Registro
def registro(request):
    if request.method == "POST":
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")

        if User.objects.filter(username=username).exists():
            messages.error(request, "El usuario ya existe")
        elif User.objects.filter(email=email).exists():
            messages.error(request, "Ya existe una cuenta con ese correo")
        else:
            try:
                validate_password(password)
            except ValidationError as errores:
                for error in errores.messages:
                    messages.error(request, error)
                return render(request, "principal/registro.html")

            user = User.objects.create_user(username=username, email=email, password=password)
            user.save()
            messages.success(request, "Usuario creado correctamente")
            return redirect("login")

    return render(request, "principal/registro.html")

# Vista de Login
def login_view(request):
    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")

        try:
            user = User.objects.get(email=email)  # Buscar usuario por email
            user_auth = authenticate(request, username=user.username, password=password)
            if user_auth is not None:
                login(request, user_auth)
                return redirect("inicio")  # redirige a página principal
            else:
                messages.error(request, "Credenciales incorrectas")
        except User.DoesNotExist:
            messages.error(request, "El correo no está registrado")

    return render(request, "principal/inicio-sesion.html")

# Vista de Logout
def logout_view(request):
    logout(request)
    return redirect("login")



# Vista para solicitar el reseteo de contraseña
def password_reset_request(request):
    if request.method == "POST":
        email = request.POST.get("email")
        form = PasswordResetForm({"email": email})
        if form.is_valid():
            form.save(
                request=request,
                use_https=request.is_secure(),
                email_template_name="principal/password_reset_email.html",
            )
            messages.success(request, "Se ha enviado un correo con instrucciones para restablecer tu contraseña.")
            return redirect("login")
    else:
        form = PasswordResetForm()

    return render(request, "principal/password_reset.html", {"form": form})

# ---------------------- CARRITO ----------------------

def obtener_carrito(request):
    """ Obtiene el carrito del usuario logueado, o el carrito anónimo
        aislado por sesión (guardado en request.session['carrito_id']).
    """
    if request.user.is_authenticated:
        carrito, _ = Carrito.objects.get_or_create(usuario=request.user)
        return carrito

    if not request.session.session_key:
        request.session.create()

    carrito_id = request.session.get('carrito_id')
    if carrito_id:
        carrito = Carrito.objects.filter(id=carrito_id, usuario__isnull=True).first()
        if carrito:
            return carrito

    carrito = Carrito.objects.create(usuario=None)
    request.session['carrito_id'] = carrito.id
    return carrito


def agregar_carrito(request):
    if request.method == "POST":
        producto_id = request.POST.get("producto_id")
        producto = get_object_or_404(Producto, id=producto_id)
        carrito = obtener_carrito(request)

        item, creado = ItemCarrito.objects.get_or_create(carrito=carrito, producto=producto)
        if not creado:
            item.cantidad += 1
            item.save()

        return JsonResponse({"success": True, "nombre": producto.nombre, "cantidad": item.cantidad})


def ver_carrito(request):
    carrito = obtener_carrito(request)
    items = carrito.items.all()
    total = sum(item.subtotal() for item in items)
    return render(request, "principal/carrito.html", {"items": items, "total": total})


@require_POST
def eliminar_item(request):
    carrito = obtener_carrito(request)
    item_id = request.POST.get("item_id")
    try:
        item = ItemCarrito.objects.get(id=item_id, carrito=carrito)
        item.delete()
        return JsonResponse({"success": True})
    except ItemCarrito.DoesNotExist:
        return JsonResponse({"success": False, "error": "Item no encontrado"})


@require_POST
def actualizar_cantidad(request):
    carrito = obtener_carrito(request)
    item_id = request.POST.get("item_id")

    try:
        nueva_cantidad = int(request.POST.get("cantidad", 1))
    except (TypeError, ValueError):
        return JsonResponse({"success": False, "error": "Cantidad inválida"})

    if nueva_cantidad < 1:
        nueva_cantidad = 1

    try:
        item = ItemCarrito.objects.get(id=item_id, carrito=carrito)
        item.cantidad = nueva_cantidad
        item.save()
        return JsonResponse({"success": True, "subtotal": item.subtotal()})
    except ItemCarrito.DoesNotExist:
        return JsonResponse({"success": False, "error": "Item no encontrado"})


def checkout(request):
    # Verificar si el usuario está autenticado
    if not request.user.is_authenticated:
        messages.error(request, "Debes iniciar sesión para realizar una compra")
        return redirect('login')
    
    carrito = obtener_carrito(request)
    items = carrito.items.all()
    total = sum(item.subtotal() for item in items)
    
    # Verificar que el carrito no esté vacío
    if not items or total == 0:
        messages.error(request, "Tu carrito está vacío")
        return redirect('ver_carrito')
    
    if request.method == "POST":
        direccion = request.POST.get("direccion")
        comuna = request.POST.get("comuna")
        
        if not direccion or not comuna:
            messages.error(request, "Por favor completa todos los campos de envío")
            return render(request, "principal/checkout.html", {
                "items": items, 
                "total": total
            })
        
        # Crear orden de compra
        orden = OrdenCompra.objects.create(
            usuario=request.user,
            carrito=carrito,
            total=total,
            direccion=direccion,
            comuna=comuna,
            estado='pendiente'
        )
        
        # Crear transacción en Transbank
        buy_order = f"orden_{orden.id}_{uuid.uuid4().hex[:8]}"
        session_id = request.session.session_key or str(request.user.id)
        return_url = request.build_absolute_uri('/webpay/return/')

        try:
            response = tx.create(buy_order, session_id, float(total), return_url)

            # Guardar token en la orden
            orden.token_transbank = response['token']
            orden.save()

            # Redirigir a Transbank
            return render(request, "principal/redirect_webpay.html", {
                'token': response['token'],
                'url': response['url']
            })

        except Exception as e:
            orden.estado = 'fallido'
            orden.save()
            messages.error(request, f"Error al procesar el pago: {str(e)}")
            return redirect("ver_carrito")

    # GET request - mostrar formulario de checkout
    return render(request, "principal/checkout.html", {
        "items": items,
        "total": total
    })


def agregar_al_carrito(request, producto_id):
    producto = get_object_or_404(Producto, id=producto_id)
    carrito = obtener_carrito(request)

    # Agregar producto o aumentar cantidad
    item, creado = ItemCarrito.objects.get_or_create(carrito=carrito, producto=producto)
    if not creado:
        item.cantidad += 1
    item.save()

    # Si la petición viene de fetch (AJAX), devolvemos JSON
    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        return JsonResponse({"success": True, "mensaje": f"{producto.nombre} agregado al carrito"})

    # Si es un submit normal, redirigimos como antes
    return redirect("ver_carrito")

def obtener_wishlist(request):
    """Obtiene la wishlist del usuario o la crea."""
    if not request.user.is_authenticated:
        return None
    wishlist, _ = Wishlist.objects.get_or_create(usuario=request.user)
    return wishlist


def agregar_wishlist(request, producto_id):
    if not request.user.is_authenticated:
        return JsonResponse({"success": False, "error": "Debes iniciar sesión"}, status=403)

    producto = get_object_or_404(Producto, id=producto_id)
    wishlist, _ = Wishlist.objects.get_or_create(usuario=request.user)
    item, creado = ItemWishlist.objects.get_or_create(wishlist=wishlist, producto=producto)

    if creado:
        return JsonResponse({"success": True, "mensaje": f"{producto.nombre} se agregó a tu wishlist."})
    else:
        return JsonResponse({"success": False, "mensaje": f"{producto.nombre} ya está en tu wishlist."})

def ver_wishlist(request):
    if not request.user.is_authenticated:
        return redirect("login")

    wishlist = obtener_wishlist(request)
    items = wishlist.items.all()
    return render(request, "principal/wishlist.html", {"items": items})

def eliminar_wishlist(request, producto_id):
    if not request.user.is_authenticated:
        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            return JsonResponse({"success": False, "mensaje": "Debes iniciar sesión"})
        return redirect("login")

    wishlist = obtener_wishlist(request)
    item = ItemWishlist.objects.filter(wishlist=wishlist, producto_id=producto_id).first()

    if item:
        item.delete()
        mensaje = "Producto eliminado de favoritos"
        success = True
    else:
        mensaje = "Producto no encontrado en favoritos"
        success = False

    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        return JsonResponse({"success": success, "mensaje": mensaje})

    messages.success(request, mensaje)
    return redirect("ver_wishlist")


def productos_hombre(request):
    productos = Producto.objects.filter(categoria='H').order_by('-id')

    wishlist_ids = []
    if request.user.is_authenticated:
        wishlist = obtener_wishlist(request)
        wishlist_ids = list(wishlist.items.values_list('producto_id', flat=True))
    for p in productos:
        p.en_wishlist = p.id in wishlist_ids

    return render(request, 'principal/productos_hombre.html', {
        'productos': productos,
        'titulo': 'Relojes de Hombre'
    })


def productos_mujer(request):
    productos = Producto.objects.filter(categoria='M').order_by('-id')

    wishlist_ids = []
    if request.user.is_authenticated:
        wishlist = obtener_wishlist(request)
        wishlist_ids = list(wishlist.items.values_list('producto_id', flat=True))
    for p in productos:
        p.en_wishlist = p.id in wishlist_ids

    return render(request, 'principal/productos_mujer.html', {
        'productos': productos,
        'titulo': 'Relojes de Mujer'
    })


def productos_todos(request):
    productos = Producto.objects.all().order_by('-id')

    wishlist_ids = []
    if request.user.is_authenticated:
        wishlist = obtener_wishlist(request)
        wishlist_ids = list(wishlist.items.values_list('producto_id', flat=True))
    
    for p in productos:
        p.en_wishlist = p.id in wishlist_ids

    return render(request, 'principal/productos_todos.html', {
        'productos': productos,
        'titulo': 'Todos los Productos'
    })


# Configurar Transbank
commerce_code = settings.TRANSBANK['COMMERCE_CODE']
api_key = settings.TRANSBANK['API_KEY']
environment = settings.TRANSBANK['ENVIRONMENT']

tx = Transaction(WebpayOptions(commerce_code, api_key, environment))


#modificacion
def webpay_return(request):
    token = request.GET.get('token_ws')
    
    if not token:
        token = request.POST.get('token_ws')
    
    if not token:
        messages.error(request, "Token no recibido")
        return redirect("ver_carrito")
    
    try:
        # Confirmar transacción
        response = tx.commit(token)
        
        # Buscar la orden por token
        orden = OrdenCompra.objects.get(token_transbank=token)
        
        if response['status'] == 'AUTHORIZED':
            # Pago exitoso
            orden.estado = 'pagado'
            orden.save()
            
            # Enviar boleta por email
            if orden.usuario and orden.usuario.email:
                enviar_boleta_email(orden)
            
            # Vaciar carrito
            orden.carrito.items.all().delete()
            
            return render(request, "principal/pago_exitoso.html", {
                'orden': orden,
                'response': response
            })
        else:
            # Pago rechazado
            orden.estado = 'rechazado'
            orden.save()
            
            return render(request, "principal/pago_rechazado.html", {
                'orden': orden,
                'response': response
            })
            
    except Exception as e:
        messages.error(request, f"Error al confirmar pago: {str(e)}")
        return redirect("ver_carrito")



def webpay_failure(request):
    """Vista para cuando el pago falla o es cancelado"""
    # Puedes agregar algún mensaje contextual si lo necesitas
    context = {
        'mensaje': 'El pago fue cancelado o no pudo ser procesado. Por favor, intenta nuevamente.'
    }
    return render(request, "principal/pago_rechazado.html", context)

# Contacto
def contacto(request):
    if request.method == 'POST':
        nombre = request.POST.get('nombre', '').strip()
        email = request.POST.get('email', '').strip()
        mensaje = request.POST.get('mensaje', '').strip()
        es_ajax = request.headers.get("x-requested-with") == "XMLHttpRequest"

        if not nombre or not email or not mensaje:
            error = "Por favor completa todos los campos."
            if es_ajax:
                return JsonResponse({"success": False, "error": error})
            messages.error(request, error)
            return redirect('contacto')

        try:
            send_mail(
                subject=f"Nuevo mensaje de contacto - {nombre}",
                message=f"Nombre: {nombre}\nEmail: {email}\n\nMensaje:\n{mensaje}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.DEFAULT_FROM_EMAIL],
                fail_silently=False,
            )
            enviado = True
        except Exception:
            enviado = False

        if es_ajax:
            return JsonResponse({"success": enviado})

        if enviado:
            messages.success(request, "¡Mensaje enviado correctamente! Te contactaremos pronto.")
        else:
            messages.error(request, "No se pudo enviar tu mensaje. Intenta nuevamente.")
        return redirect('contacto')

    return render(request, 'principal/contacto.html')


def robots_txt(request):
    lineas = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin/",
        "Disallow: /inventario/",
        "Disallow: /carrito/",
        "Disallow: /checkout/",
        f"Sitemap: {request.build_absolute_uri('/sitemap.xml')}",
    ]
    return HttpResponse("\n".join(lineas), content_type="text/plain")