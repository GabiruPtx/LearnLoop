from django.urls import path
from . import views

app_name = 'public'

urlpatterns = [
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('', views.login, name='login'),
    path('cadastro/', views.cadastro, name='cadastro'),
    path('index/', views.index, name='index'),
]
