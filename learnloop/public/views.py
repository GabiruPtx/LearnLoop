from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404

# Create your views here.
from django.shortcuts import render, redirect
from django.contrib import messages

from .forms import *
from .models import *


@login_required
def index(request):
    is_professor_check = request.user.is_authenticated and request.user.tipo_usuario == 'professor'

    # Busca todos os projetos acessíveis pelo usuário, ordenados por nome
    projetos_atuais = Projeto.objects.filter(
        Q(responsavel=request.user) | Q(participantes=request.user)
    ).distinct().order_by('nome')

    selected_project_id = request.GET.get('projeto_id')
    selected_project = None
    roadmap_milestones = []
    user_tasks_for_project = []
    project_title = "Nenhum projeto selecionado"
    colunas = []

    if selected_project_id:
        try:
            # Busca o projeto selecionado dentro dos projetos acessíveis pelo usuário
            selected_project = get_object_or_404(
                projetos_atuais, id=selected_project_id
            )
            project_title = selected_project.nome

            # Carrega as colunas e suas respectivas tarefas para o projeto selecionado
            colunas = Coluna.objects.filter(projeto=selected_project).prefetch_related('tarefas').order_by('ordem')

            # Marcos do Roadmap
            roadmap_milestones = Milestone.objects.filter(
                projeto=selected_project
            ).order_by('data_limite')

            # Minhas Tarefas no projeto selecionado
            user_tasks_for_project = Tarefa.objects.filter(
                projeto=selected_project,
                responsaveis=request.user
            ).order_by('coluna__ordem', 'prioridade')  # AJUSTE: Ordena pela ordem da coluna

        except ValueError:
            messages.error(request, "ID do projeto inválido.")
            project_title = "ID de projeto inválido"

    context = {
        "is_professor": is_professor_check,
        "projetos_atuais": projetos_atuais,
        "selected_project": selected_project,
        "project_title": project_title,
        "roadmap_milestones": roadmap_milestones,
        "user_tasks_for_project": user_tasks_for_project,
        "colunas": colunas,
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
            project_name = request.POST.get('project_name')

            if not project_name or project_name.strip() == "":
                return JsonResponse({'status': 'error', 'message': 'O nome do projeto não pode ser vazio.'}, status=400)

            # Cria o projeto
            novo_projeto = Projeto.objects.create(
                nome=project_name.strip(),
                responsavel=request.user,

            )
            return JsonResponse({
                'status': 'success',
                'message': 'Projeto criado com sucesso!',
                'projeto_id': novo_projeto.id,
                'projeto_nome': novo_projeto.nome
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': f'Ocorreu um erro no servidor: {str(e)}'}, status=500)

    return JsonResponse({'status': 'error', 'message': 'Método não permitido.'}, status=405)


@login_required
def criar_tarefa_ajax(request):
    if request.method == 'POST':
        try:
            task_title = request.POST.get('task_title')
            task_description = request.POST.get('task_description', '')
            project_id = request.POST.get('project_id')
            responsaveis_ids = request.POST.getlist('responsaveis[]')

            if not task_title or not task_title.strip():
                return JsonResponse({'status': 'error', 'message': 'O título da tarefa é obrigatório.'}, status=400)

            if not project_id:
                return JsonResponse({'status': 'error', 'message': 'ID do projeto não fornecido.'}, status=400)

            projeto_selecionado = get_object_or_404(Projeto, id=project_id)

            if not (projeto_selecionado.responsavel == request.user or projeto_selecionado.participantes.filter(id=request.user.id).exists()):
                return JsonResponse(
                    {'status': 'error', 'message': 'Você não tem permissão para adicionar tarefas a este projeto.'},
                    status=403)

            primeira_coluna = Coluna.objects.filter(projeto=projeto_selecionado).order_by('ordem').first()
            if not primeira_coluna:
                return JsonResponse({'status': 'error', 'message': 'O projeto não possui colunas configuradas.'}, status=400)

            nova_tarefa = Tarefa.objects.create(
                titulo=task_title.strip(),
                descricao=task_description.strip(),
                projeto=projeto_selecionado,
                coluna=primeira_coluna  # Associa a tarefa à primeira coluna
            )

            if responsaveis_ids:
                alunos_validos = UsuarioPersonalizado.objects.filter(id__in=responsaveis_ids, tipo_usuario='aluno')
                nova_tarefa.responsaveis.set(alunos_validos)

            return JsonResponse({
                'status': 'success',
                'message': 'Tarefa criada com sucesso!',
                'tarefa_id': nova_tarefa.id,
                'tarefa_titulo': nova_tarefa.titulo
            })

        except Exception as e:
            return JsonResponse({'status': 'error', 'message': f'Ocorreu um erro: {str(e)}'}, status=500)

    return JsonResponse({'status': 'error', 'message': 'Método não permitido.'}, status=405)


@login_required
def adicionar_membro_ajax(request):
    if request.method == 'POST':
        try:
            matricula_aluno = request.POST.get('matricula_aluno')
            projeto_id = request.POST.get('projeto_id')

            if not matricula_aluno or not matricula_aluno.strip():
                return JsonResponse({'status': 'error', 'message': 'A matrícula do aluno não pode ser vazia.'}, status=400)
            if not projeto_id:
                return JsonResponse({'status': 'error', 'message': 'ID do projeto não fornecido.'}, status=400)

            projeto = get_object_or_404(Projeto, id=projeto_id)

            # Verificar permissão: somente o responsável pelo projeto pode adicionar membros
            if projeto.responsavel != request.user:
                return JsonResponse({'status': 'error', 'message': 'Você não tem permissão para adicionar membros a este projeto.'}, status=403)

            try:
                # Busca o usuário que é aluno pela matrícula
                aluno_a_adicionar = UsuarioPersonalizado.objects.get(matricula=matricula_aluno, tipo_usuario='aluno')
            except UsuarioPersonalizado.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': f'Aluno com matrícula "{matricula_aluno}" não encontrado ou não é um aluno.'}, status=404)
            except UsuarioPersonalizado.MultipleObjectsReturned:
                return JsonResponse({'status': 'error', 'message': f'Múltiplos usuários encontrados com a matrícula "{matricula_aluno}". Verifique os dados.'}, status=400)

            if aluno_a_adicionar in projeto.participantes.all():
                return JsonResponse({'status': 'info', 'message': f'{aluno_a_adicionar.nome_completo or aluno_a_adicionar.username} já é participante deste projeto.'})

            projeto.participantes.add(aluno_a_adicionar)
            # Aqui você poderia, opcionalmente, criar um log da ação ou notificação

            return JsonResponse({
                'status': 'success',
                'message': f'{aluno_a_adicionar.nome_completo or aluno_a_adicionar.username} foi adicionado ao projeto "{projeto.nome}" com sucesso!',
                'membro_nome': aluno_a_adicionar.nome_completo or aluno_a_adicionar.username
            })

        except Projeto.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Projeto não encontrado.'}, status=404)
        except ValueError: # Se projeto_id não for um inteiro/UUID válido
             return JsonResponse({'status': 'error', 'message': 'ID do projeto inválido.'}, status=400)
        except Exception as e:
            # Em um ambiente de produção, você logaria o erro 'e'
            # logger.error(f"Erro ao adicionar membro: {e}")
            return JsonResponse({'status': 'error', 'message': f'Ocorreu um erro no servidor. Por favor, tente novamente.'}, status=500)

    return JsonResponse({'status': 'error', 'message': 'Método não permitido.'}, status=405)

@login_required
def get_project_participants_ajax(request, projeto_id):
    """
    Retorna os participantes (alunos) de um projeto que podem ser designados a tarefas.
    """
    projeto = get_object_or_404(Projeto, id=projeto_id)

    # Verifica se o usuário tem permissão
    if not (projeto.responsavel == request.user or projeto.participantes.filter(id=request.user.id).exists()):
        return JsonResponse({'status': 'error', 'message': 'Permissão negada.'}, status=403)

    # Filtra apenas por participantes que são alunos
    participantes = projeto.participantes.filter(tipo_usuario='aluno').values('id', 'nome_completo')

    return JsonResponse({'status': 'success', 'participantes': list(participantes)})
