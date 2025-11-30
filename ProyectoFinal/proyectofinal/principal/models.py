from django.db import models
from django.contrib.auth.models import User

class Producto(models.Model):
    CATEGORIAS = [('H', 'Hombre'),('M', 'Mujer'),]
    nombre = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    foto = models.ImageField(upload_to='productos/', blank=True, null=True)
    categoria = models.CharField(max_length=1, choices=CATEGORIAS, default='H')

    def __str__(self):
        return f"{self.nombre} ({self.get_categoria_display()})"


class Carrito(models.Model):
    creado = models.DateTimeField(auto_now_add=True)
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"Carrito de {self.usuario}" if self.usuario else "Carrito Anónimo"


class ItemCarrito(models.Model):
    carrito = models.ForeignKey(Carrito, on_delete=models.CASCADE, related_name="items")
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)

    def subtotal(self):
        return self.cantidad * self.producto.precio


# WISHLIST
class Wishlist(models.Model):
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wishlist")

    def __str__(self):
        return f"Wishlist de {self.usuario.username}"


class ItemWishlist(models.Model):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name="items")
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("wishlist", "producto")

    def __str__(self):
        return f"{self.producto.nombre} en wishlist de {self.wishlist.usuario.username}"


#TRANSBANK
class OrdenCompra(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('rechazado', 'Rechazado'),
        ('fallido', 'Fallido'),
    ]
    
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    carrito = models.ForeignKey(Carrito, on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    direccion = models.TextField()
    comuna = models.CharField(max_length=100)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    token_transbank = models.CharField(max_length=200, blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Orden {self.id} - {self.usuario.username}"