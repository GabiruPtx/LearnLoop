from django.shortcuts import render

# Create your views here.

def index(request):
    return render(request, "public/pages/index.html")

def cadastro(request):
    return render(request, "public/pages/cadastro.html")
