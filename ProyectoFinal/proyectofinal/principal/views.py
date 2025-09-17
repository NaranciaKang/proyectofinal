from django.shortcuts import render, redirect
from .models import Producto
from .forms import ProductoForm

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