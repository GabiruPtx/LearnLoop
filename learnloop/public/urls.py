from django.urls import path
from . import views

app_name = 'public'

urlpatterns = [
    path('', views.index, name='index'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('login/', views.login, name='login'),
    path('cadastro/', views.cadastro, name='cadastro'),
]
