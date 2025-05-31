from django.contrib.auth import authenticate, login as auth_login
from django.shortcuts import render

# Create your views here.
from django.shortcuts import render, redirect
from django.contrib import messages

from .forms import CadastroForm, LoginForm
from .models import *
def index(request):
    return render(request, "public/pages/index.html")

def indexAluno(request):
    return render(request, "public/pages/indexAluno.html")

def indexProfessor(request):
    return render(request, "public/pages/indexProfessor.html")

# public/views.py


def cadastro(request):
    if request.method == "POST":
        print("DEBUG: Dados recebidos em request.POST:", request.POST)
        form = CadastroForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Cadastro realizado com sucesso!")
            return redirect("/")
    else:
        form = CadastroForm()

    return render(request, 'public/pages/cadastro.html', {'form': form})


def login(request):
    if request.method == "POST":
        form = LoginForm(request.POST)

        if form.is_valid():
            matricula = form.cleaned_data.get('matricula')
            senha = form.cleaned_data.get('password')

            user = authenticate(request, matricula=matricula, password=senha)

            if user is not None:
                auth_login(request, user)

                if user.tipo_usuario == 'aluno':
                    messages.success(request, f'Bem-vindo(a), aluno(a) {user.nome_completo}!')
                    return redirect('public:indexAluno')
                elif user.tipo_usuario == 'professor':
                    messages.success(request, f'Bem-vindo(a), professor(a) {user.nome_completo}!')
                    return redirect('public:indexProfessor')
                else:
                    return redirect('public:index')
            else:

                messages.error(request, 'Matrícula ou senha inválida.')
                return redirect('public:login')
    else:
        form = LoginForm()
    return render(request, "public/pages/login.html", {"form": form})

def forgot_password(request):
    return render(request, "public/pages/forgot_password.html")

