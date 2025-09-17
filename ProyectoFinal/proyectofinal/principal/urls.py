from django.urls import path
from .views import principal
from . import views

urlpatterns = [
    path('',views.principal,name='principal'),
    path('inicio/', views.inicio, name='inicio'),
]