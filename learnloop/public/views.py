from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.models import Q
from django.shortcuts import render

# Create your views here.
from django.shortcuts import render, redirect
from django.contrib import messages

from .forms import CadastroForm, LoginForm, ProjetoForm
from .models import *


@login_required
def index(request):
    # Verifica se o usuário é professor
    is_professor_check = request.user.is_authenticated and request.user.tipo_usuario == 'professor'

    # Busca os projetos em que o usuário é responsável ou participante
    projetos_atuais = Projeto.objects.filter(
        Q(responsavel=request.user) | Q(participantes=request.user)
    ).distinct()

    context = {
        "is_professor": is_professor_check,
        "projetos_atuais": projetos_atuais,
    }
    return render(request, "public/pages/index.html", context=context)

def cadastro(request):
    if request.method == "POST":
        print("DEBUG: Dados recebidos em request.POST:", request.POST)
        form = CadastroForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Cadastro realizado com sucesso!")
            return redirect("public:login")
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
                    return redirect('public:index')
                elif user.tipo_usuario == 'professor':
                    messages.success(request, f'Bem-vindo(a), professor(a) {user.nome_completo}!')
                    return redirect('public:index')
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

def is_professor(user):
    return user.is_authenticated and user.tipo_usuario == 'professor'


@login_required  # Garante que o usuário esteja logado
@user_passes_test(is_professor, login_url='/login/')  # Garante que apenas professores acessem
def criar_projeto(request):
    if request.method == 'POST':
        form = ProjetoForm(request.POST)
        if form.is_valid():
            projeto = form.save(commit=False)
            projeto.responsavel = request.user  # O usuário logado (professor) é o responsável
            projeto.save()

            # Adiciona os participantes (alunos)
            for aluno in form.cleaned_data['participantes']:
                projeto.participantes.add(aluno)

            messages.success(request, 'Projeto criado com sucesso!')
            return redirect('public:indexProfessor')  # Redireciona para o painel do professor
    else:
        form = ProjetoForm()

    return render(request, 'public/pages/criar_projeto.html', {'form': form})