from django.shortcuts import render, redirect
from .models import Producto
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





def principal(request):
    if request.method == 'POST':
        form = ProductoForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('principal')  # evita reenvío del form
    else:
        form = ProductoForm()

    productos = Producto.objects.all().order_by('-id')
    return render(request, 'principal/index.html', {
        'form': form,
        'productos': productos,
    })

def inicio(request):
    productos = Producto.objects.all().order_by('-id')[:8]  # últimos 8 productos
    return render(request, 'principal/inicio.html', {
        'productos': productos
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
        else:
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
