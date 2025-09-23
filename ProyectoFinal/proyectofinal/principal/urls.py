from django.urls import path
from .views import principal
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('',views.principal,name='principal'),
    path('inicio/', views.inicio, name='inicio'),
    path('registro/', views.registro, name='registro'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path("agregar-carrito/", views.agregar_carrito, name="agregar_carrito"),
    path("carrito/", views.ver_carrito, name="ver_carrito"),
    path("eliminar-item/", views.eliminar_item, name="eliminar_item"),
    path("actualizar-cantidad/", views.actualizar_cantidad, name="actualizar_cantidad"),
    path("checkout/", views.checkout, name="checkout"),
    path("agregar/<int:producto_id>/", views.agregar_al_carrito, name="agregar_al_carrito"),



    # 🔹 Recuperación de contraseña
    path("password-reset/", views.password_reset_request, name="password_reset"),
    path("reset/<uidb64>/<token>/", 
        auth_views.PasswordResetConfirmView.as_view(template_name="principal/password_reset_confirm.html"), 
        name="password_reset_confirm"),
    path("reset/done/", 
        auth_views.PasswordResetCompleteView.as_view(template_name="principal/password_reset_done.html"), 
        name="password_reset_complete"),

]

