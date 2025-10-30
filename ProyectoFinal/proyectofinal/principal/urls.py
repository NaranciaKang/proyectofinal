from django.urls import path
from .views import principal, productos_todos
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('',views.inicio,name='inicio'),
    path('inventario/', views.principal, name='inventario'),
    path('registro/', views.registro, name='registro'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path("agregar-carrito/", views.agregar_carrito, name="agregar_carrito"),
    path("carrito/", views.ver_carrito, name="ver_carrito"),
    path("eliminar-item/", views.eliminar_item, name="eliminar_item"),
    path("actualizar-cantidad/", views.actualizar_cantidad, name="actualizar_cantidad"),
    path("checkout/", views.checkout, name="checkout"),
    path("agregar/<int:producto_id>/", views.agregar_al_carrito, name="agregar_al_carrito"),
    path("wishlist/", views.ver_wishlist, name="ver_wishlist"),
    path("wishlist/agregar/<int:producto_id>/", views.agregar_wishlist, name="agregar_wishlist"),
    path("wishlist/eliminar/<int:producto_id>/", views.eliminar_wishlist, name="eliminar_wishlist"),
    path("hombre/", views.productos_hombre, name="productos_hombre"),
    path("mujer/", views.productos_mujer, name="productos_mujer"),
    path("productos/", views.productos_todos, name="productos_todos"),



    # 🔹 Recuperación de contraseña
    path("password-reset/", views.password_reset_request, name="password_reset"),
    path("reset/<uidb64>/<token>/", 
        auth_views.PasswordResetConfirmView.as_view(template_name="principal/password_reset_confirm.html"), 
        name="password_reset_confirm"),
    path("reset/done/", 
        auth_views.PasswordResetCompleteView.as_view(template_name="principal/password_reset_done.html"), 
        name="password_reset_complete"),

]

