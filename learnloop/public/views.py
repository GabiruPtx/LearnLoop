from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.models import Q
from django.http import JsonResponse
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

def adicionar_participantes(request, projeto_id):
    projeto = Projeto.objects.get(id=projeto_id)

    if request.method == 'POST':
        form = ProjetoForm(request.POST, instance=projeto)
        if form.is_valid():
            form.save()
            messages.success(request, 'Participantes adicionados com sucesso!')
            return redirect('public:index')
    else:
        form = ProjetoForm(instance=projeto)

    return render(request, 'public/pages/adicionar_participantes.html', {'form': form, 'projeto': projeto})


@login_required
@user_passes_test(is_professor, login_url='public:login')
def criar_projeto_ajax(request):
    if request.method == 'POST':
        try:
            # Se estiver enviando como x-www-form-urlencoded (como no JS exemplo)
            project_name = request.POST.get('project_name')

            # Se estivesse enviando como JSON:
            # data = json.loads(request.body)
            # project_name = data.get('project_name')

            if not project_name or project_name.strip() == "":
                return JsonResponse({'status': 'error', 'message': 'O nome do projeto não pode ser vazio.'}, status=400)

            # Cria o projeto
            novo_projeto = Projeto.objects.create(
                nome=project_name.strip(),
                responsavel=request.user,
                # Outros campos terão seus valores padrão ou nulos/brancos conforme o modelo
                # descricao="", # Pode ser deixado em branco se blank=True
                # publico=True, # Se houver default no modelo
                # ativo=True,   # Se houver default no modelo
            )
            # Nenhum participante é adicionado aqui, conforme solicitado
            print("foi")
            return JsonResponse({
                'status': 'success',
                'message': 'Projeto criado com sucesso!',
                'projeto_id': novo_projeto.id,
                'projeto_nome': novo_projeto.nome
            })
        except Exception as e:
            # Logar o erro e.g. logger.error(f"Erro ao criar projeto: {e}")
            return JsonResponse({'status': 'error', 'message': f'Ocorreu um erro no servidor: {str(e)}'}, status=500)

    return JsonResponse({'status': 'error', 'message': 'Método não permitido.'}, status=405)
