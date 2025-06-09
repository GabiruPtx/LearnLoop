from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
import json
from datetime import date, timedelta

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

def configuracao(request, projeto_id):
    projeto = get_object_or_404(Projeto, id=projeto_id)
    participantes_atuais = projeto.participantes.all()
    context = {
        'project': projeto,
        'participantes_atuais': participantes_atuais,
    }
    return render(request, "public/pages/configuracao.html", context)

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
            column_id = request.POST.get('column_id')  # Recebe o ID da coluna
            responsaveis_ids = request.POST.getlist('responsaveis[]')

            if not task_title or not task_title.strip():
                return JsonResponse({'status': 'error', 'message': 'O título da tarefa é obrigatório.'}, status=400)

            if not project_id:
                return JsonResponse({'status': 'error', 'message': 'ID do projeto não fornecido.'}, status=400)

            if not column_id:
                return JsonResponse({'status': 'error', 'message': 'ID da coluna não fornecido.'}, status=400)

            projeto_selecionado = get_object_or_404(Projeto, id=project_id)

            # Valida permissão
            if not (projeto_selecionado.responsavel == request.user or projeto_selecionado.participantes.filter(
                    id=request.user.id).exists()):
                return JsonResponse(
                    {'status': 'error', 'message': 'Você não tem permissão para adicionar tarefas a este projeto.'},
                    status=403)

            coluna_selecionada = get_object_or_404(Coluna, id=column_id, projeto=projeto_selecionado)

            nova_tarefa = Tarefa.objects.create(
                titulo=task_title.strip(),
                descricao=task_description.strip(),
                projeto=projeto_selecionado,
                coluna=coluna_selecionada  # Associa a tarefa à coluna correta
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

        except Coluna.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Coluna não encontrada ou não pertence a este projeto.'},
                                status=404)
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

@login_required
@require_http_methods(["GET", "POST"])
def manage_sprints_ajax(request, projeto_id):
    projeto = get_object_or_404(Projeto, id=projeto_id)

    if request.user != projeto.responsavel:
        return JsonResponse({'status': 'error', 'message': 'Permissão negada.'}, status=403)

    if request.method == 'POST':
        data = json.loads(request.body)
        action = data.get('action')

        if action == 'save_settings':
            duration = data.get('duration')
            unit = data.get('unit')
            if duration and unit in ['weeks', 'days']:
                projeto.iteration_duration = int(duration)
                projeto.iteration_unit = unit
                projeto.save()
                return JsonResponse({'status': 'success', 'message': 'Configurações salvas com sucesso!'})

        elif action == 'add_iteration':
            start_date_str = data.get('start_date')
            
            # --- LÓGICA DE DURAÇÃO MAIS SEGURA ---
            raw_duration = data.get('duration')
            try:
                # Usa a duração enviada apenas se ela for um número válido
                duration = int(raw_duration) if raw_duration else projeto.iteration_duration
            except (ValueError, TypeError):
                # Se não for válido (ex: texto vazio, letras), usa o padrão do projeto
                duration = projeto.iteration_duration
            # ------------------------------------

            unit = data.get('unit', projeto.iteration_unit)
            
            try:
                start_date = date.fromisoformat(start_date_str) if start_date_str else date.today()
            except (ValueError, TypeError):
                last_sprint = projeto.sprints.order_by('-data_fim').first()
                start_date = last_sprint.data_fim + timedelta(days=1) if last_sprint and last_sprint.data_fim else date.today()

            if unit == 'weeks':
                end_date = start_date + timedelta(weeks=duration)
            else: # days
                end_date = start_date + timedelta(days=duration)
            
            end_date -= timedelta(days=1)

            sprint_count = projeto.sprints.count() + 1
            Sprint.objects.create(
                projeto=projeto, nome=f"Iteração {sprint_count}", data_inicio=start_date, data_fim=end_date
            )
            return JsonResponse({'status': 'success', 'message': 'Iteração adicionada!'})
        
        elif action == 'delete_iteration':
            sprint_id = data.get('sprint_id')
            try:
                sprint_to_delete = Sprint.objects.get(id=sprint_id, projeto=projeto)
                sprint_to_delete.delete()
                return JsonResponse({'status': 'success', 'message': 'Iteração removida.'})
            except Sprint.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'Iteração não encontrada.'}, status=404)

        return JsonResponse({'status': 'error', 'message': 'Ação inválida.'}, status=400)

    # LÓGICA GET COM ESTADO DINÂMICO
    sprints = projeto.sprints.order_by('data_inicio')
    today = date.today()
    sprints_list = []

    for sprint in sprints:
        status_display = "Planejada"
        if sprint.data_inicio and sprint.data_fim:
            if sprint.data_fim < today:
                status_display = "Concluída"
            elif sprint.data_inicio <= today <= sprint.data_fim:
                status_display = "Atual"

        sprints_list.append({
            'id': sprint.id,
            'nome': sprint.nome,
            'data_inicio': sprint.data_inicio.strftime('%b %d'),
            'data_fim': sprint.data_fim.strftime('%b %d, %Y'),
            'status': status_display
        })
            
    return JsonResponse({
        'status': 'success',
        'settings': {'duration': projeto.iteration_duration, 'unit': projeto.iteration_unit},
        'sprints': sprints_list
    })

@login_required
@require_http_methods(["GET", "POST"])
def manage_milestones_ajax(request, projeto_id):
    projeto = get_object_or_404(Projeto, id=projeto_id)

    if request.method == 'POST':
        # Apenas o responsável pode fazer alterações
        if request.user != projeto.responsavel:
            return JsonResponse({'status': 'error', 'message': 'Permissão negada.'}, status=403)
        
        data = json.loads(request.body)
        action = data.get('action')

        if action == 'create' or action == 'edit':
            title = data.get('title')
            description = data.get('description')
            due_date = data.get('due_date') if data.get('due_date') else None

            if not title:
                return JsonResponse({'status': 'error', 'message': 'O título é obrigatório.'}, status=400)

            if action == 'create':
                Milestone.objects.create(
                    projeto=projeto, nome=title, descricao=description, data_limite=due_date
                )
                return JsonResponse({'status': 'success', 'message': 'Milestone criado com sucesso!'})
            else: # edit
                milestone_id = data.get('id')
                milestone = get_object_or_404(Milestone, id=milestone_id, projeto=projeto)
                milestone.nome = title
                milestone.descricao = description
                milestone.data_limite = due_date
                milestone.save()
                return JsonResponse({'status': 'success', 'message': 'Milestone atualizado com sucesso!'})

        if action == 'close' or action == 'reopen':
            milestone_id = data.get('id')
            milestone = get_object_or_404(Milestone, id=milestone_id, projeto=projeto)
            milestone.status = StatusMilestoneChoices.CLOSED if action == 'close' else StatusMilestoneChoices.OPEN
            milestone.save()
            return JsonResponse({'status': 'success', 'message': f'Milestone {milestone.status.lower()} com sucesso!'})

        if action == 'delete':
            milestone_id = data.get('id')
            milestone = get_object_or_404(Milestone, id=milestone_id, projeto=projeto)
            milestone.delete()
            return JsonResponse({'status': 'success', 'message': 'Milestone excluído com sucesso!'})
            
        return JsonResponse({'status': 'error', 'message': 'Ação desconhecida.'}, status=400)


    # Lógica para GET (buscar e calcular os dados)
    milestones = projeto.milestones.prefetch_related('tarefas').all()
    today = date.today()
    milestones_data = []

    # Ordenação
    sort_by = request.GET.get('sort', 'due_date')
    if sort_by == 'closest_due':
        milestones = milestones.order_by('data_limite')
    elif sort_by == 'furthest_due':
        milestones = milestones.order_by('-data_limite')
    # Adicione outras lógicas de sort aqui se desejar

    for m in milestones:
        tasks = m.tarefas.all()
        total_tasks = len(tasks)
        closed_tasks = tasks.filter(coluna__nome__iexact='Complete').count()
        progress = int((closed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
        
        overdue_days = 0
        if m.data_limite and m.data_limite < today and m.status == 'OPEN':
            overdue_days = (today - m.data_limite).days

        milestones_data.append({
            'id': m.id,
            'nome': m.nome,
            'descricao': m.descricao,
            'data_limite_raw': m.data_limite,
            'data_limite_formatted': m.data_limite.strftime('Due by %b %d, %Y') if m.data_limite else 'No due date',
            'status': m.status,
            'progress': progress,
            'open_tasks': total_tasks - closed_tasks,
            'closed_tasks': closed_tasks,
            'overdue_days': overdue_days
        })

    return JsonResponse({'status': 'success', 'milestones': milestones_data})

@login_required
def search_users_ajax(request, projeto_id):
    query = request.GET.get('q', '').strip()
    user_type = request.GET.get('type', 'all')
    
    projeto = get_object_or_404(Projeto, id=projeto_id)
    ids_excluidos = list(projeto.participantes.values_list('id', flat=True))
    ids_excluidos.append(projeto.responsavel.id)

    # Inicia com todos os usuários possíveis
    queryset = UsuarioPersonalizado.objects.exclude(id__in=ids_excluidos)

    # Se houver uma query, aplica o filtro de busca
    if query:
        search_filter = Q(nome_completo__icontains=query) | Q(matricula__icontains=query)
        queryset = queryset.filter(search_filter)
    
    # Filtra por tipo de usuário, se especificado
    if user_type in ['aluno', 'professor']:
        queryset = queryset.filter(tipo_usuario=user_type)
        
    users = list(queryset.values('id', 'nome_completo', 'matricula', 'tipo_usuario')[:10])
    
    return JsonResponse({'users': users})


@login_required
@require_http_methods(["POST"])
def manage_collaborators_ajax(request, projeto_id):
    try:
        projeto = get_object_or_404(Projeto, id=projeto_id)
        if request.user != projeto.responsavel:
            return JsonResponse({'status': 'error', 'message': 'Permissão negada.'}, status=403)

        data = json.loads(request.body)
        action = data.get('action')
        user_ids = data.get('user_ids', [])

        if not user_ids:
            return JsonResponse({'status': 'error', 'message': 'Nenhum usuário selecionado.'}, status=400)

        users = UsuarioPersonalizado.objects.filter(id__in=user_ids)

        if action == 'add':
            projeto.participantes.add(*users)
            added_members_data = []
            for user in users:
                added_members_data.append({
                    'id': user.id,
                    'nome_completo': user.nome_completo,
                    'matricula': user.matricula,
                    'tipo_usuario': user.tipo_usuario,
                    'get_tipo_usuario_display': user.get_tipo_usuario_display()
                })

            message = f"{len(users)} usuário(s) adicionado(s) com sucesso."
            if len(users) == 1:
                message = f"{users.first().nome_completo} foi adicionado(a) com sucesso."
            
            return JsonResponse({
                'status': 'success', 
                'message': message,
                'added_members': added_members_data # Retorna os dados dos novos membros
            })
            
        elif action == 'remove':
            projeto.participantes.remove(*users)
            return JsonResponse({'status': 'success', 'message': f'{len(users)} usuário(s) removido(s) com sucesso.'})

        else:
            return JsonResponse({'status': 'error', 'message': 'Ação inválida.'}, status=400)

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
