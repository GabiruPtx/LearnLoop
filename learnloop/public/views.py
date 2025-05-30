from django.shortcuts import render

# Create your views here.

def index(request):
    return render(request, "public/pages/index.html")

def cadastro(request):
    return render(request, "public/pages/cadastro.html")

def login(request):
    return render(request, "public/pages/login.html")

def forgot_password(request):
    return render(request, "public/pages/forgot_password.html")
