# LearnLoop/learnloop/public/views.py
import markdown
from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.decorators import login_required, user_passes_test
from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction  # Importe o transaction
from django.db.models import Q, Max  # Importe o Max
from django.forms.models import model_to_dict
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.views.decorators.http import require_http_methods
import json
from datetime import date, timedelta
from django.urls import reverse
# Create your views here.
from django.shortcuts import render, redirect
from django.contrib import messages

from .forms import *
from .models import *

@login_required
def index(request):
    is_professor_check = request.user.is_authenticated and request.user.tipo_usuario == 'professor'

    # Lógica de visibilidade de projetos baseada no tipo de usuário
    if request.user.tipo_usuario == 'professor':
        # Professores (responsável ou participante) veem todos os seus projetos, ativos ou fechados.
        projetos_visiveis = Projeto.objects.filter(
            Q(responsavel=request.user) | Q(participantes=request.user)
        ).distinct()
    else:  # Aluno
        # Alunos só veem projetos ativos dos quais participam.
        projetos_visiveis = Projeto.objects.filter(
            Q(participantes=request.user) & Q(ativo=True)
        ).distinct()

    projetos_atuais = projetos_visiveis.order_by('nome')

    selected_project_id = request.GET.get('projeto_id')
    selected_project = None
    roadmap_milestones = []
    user_tasks_for_project = []
    project_title = "Nenhum projeto selecionado"
    colunas = []

    if selected_project_id:
        try:
            # Busca o projeto selecionado DENTRO dos projetos que já foram filtrados como visíveis para o usuário.
            # Isso impede que um aluno acesse um projeto fechado pela URL.
            selected_project = get_object_or_404(
                projetos_visiveis, id=selected_project_id
            )
            project_title = selected_project.nome

            # Carrega as colunas e suas respectivas tarefas para o projeto selecionado
            colunas = Coluna.objects.filter(projeto=selected_project).prefetch_related(
                'tarefas__projeto',
                'tarefas__prioridade',
                'tarefas__tamanho',
                'tarefas__sprint',
                'tarefas__tags'
            ).order_by('ordem')

            # Marcos do Roadmap
            roadmap_milestones = Milestone.objects.filter(
                projeto=selected_project
            ).order_by('data_limite')

            # Minhas Tarefas no projeto selecionado
            user_tasks_for_project = Tarefa.objects.filter(
                projeto=selected_project,
                responsaveis=request.user
            ).order_by('coluna__ordem', 'prioridade')

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


def configuracao(request, projeto_id):
    projeto = get_object_or_404(Projeto, id=projeto_id)
    is_professor_check = request.user.is_authenticated and request.user.tipo_usuario == 'professor'
    participantes_atuais = projeto.participantes.all()
    context = {
        'project': projeto,
        'participantes_atuais': participantes_atuais,
        'is_professor': is_professor_check,
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
            column_id = request.POST.get('column_id')
            responsaveis_ids = request.POST.getlist('responsaveis[]')
            milestone_id = request.POST.get('milestone_id')
            label_ids = request.POST.getlist('tags[]')

            if not task_title or not task_title.strip():
                return JsonResponse({'status': 'error', 'message': 'O título da tarefa é obrigatório.'}, status=400)

            if not project_id:
                return JsonResponse({'status': 'error', 'message': 'ID do projeto não fornecido.'}, status=400)

            if not column_id:
                return JsonResponse({'status': 'error', 'message': 'ID da coluna não fornecido.'}, status=400)

            projeto_selecionado = get_object_or_404(Projeto, id=project_id)

            if not (projeto_selecionado.responsavel == request.user or projeto_selecionado.participantes.filter(
                    id=request.user.id).exists()):
                return JsonResponse(
                    {'status': 'error', 'message': 'Você não tem permissão para adicionar tarefas a este projeto.'},
                    status=403)

            coluna_selecionada = get_object_or_404(Coluna, id=column_id, projeto=projeto_selecionado)

            milestone_obj = None
            if milestone_id:
                try:
                    milestone_obj = Milestone.objects.get(id=milestone_id, projeto=projeto_selecionado, status=StatusMilestoneChoices.OPEN)
                except Milestone.DoesNotExist:
                    return JsonResponse({'status': 'error', 'message': 'Milestone inválido ou não encontrado.'}, status=400)

            nova_tarefa = Tarefa.objects.create(
                titulo=task_title.strip(),
                descricao=task_description.strip(),
                projeto=projeto_selecionado,
                coluna=coluna_selecionada,
                milestone=milestone_obj
            )

            if responsaveis_ids:
                alunos_validos = UsuarioPersonalizado.objects.filter(id__in=responsaveis_ids, tipo_usuario='aluno')
                nova_tarefa.responsaveis.set(alunos_validos)

            if label_ids:
                labels_validas = Tag.objects.filter(id__in=label_ids, projeto=projeto_selecionado)
                nova_tarefa.tags.set(labels_validas)

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
            # O nome do campo no POST ('matricula_aluno') é mantido por compatibilidade com o frontend.
            matricula_usuario = request.POST.get('matricula_aluno')
            projeto_id = request.POST.get('projeto_id')

            if not matricula_usuario or not matricula_usuario.strip():
                return JsonResponse({'status': 'error', 'message': 'A matrícula do membro não pode ser vazia.'},
                                    status=400)
            if not projeto_id:
                return JsonResponse({'status': 'error', 'message': 'ID do projeto não fornecido.'}, status=400)

            projeto = get_object_or_404(Projeto, id=projeto_id)

            # Verificar permissão: somente o responsável pelo projeto pode adicionar membros
            if projeto.responsavel != request.user:
                return JsonResponse(
                    {'status': 'error', 'message': 'Você não tem permissão para adicionar membros a este projeto.'},
                    status=403)

            try:
                # Busca o usuário pela matrícula, permitindo qualquer tipo (aluno ou professor)
                usuario_a_adicionar = UsuarioPersonalizado.objects.get(matricula=matricula_usuario)
            except UsuarioPersonalizado.DoesNotExist:
                return JsonResponse(
                    {'status': 'error', 'message': f'Usuário com matrícula "{matricula_usuario}" não encontrado.'},
                    status=404)
            except UsuarioPersonalizado.MultipleObjectsReturned:
                return JsonResponse({'status': 'error',
                                     'message': f'Múltiplos usuários encontrados com a matrícula "{matricula_usuario}". Verifique os dados.'},
                                    status=400)

            if usuario_a_adicionar in projeto.participantes.all():
                return JsonResponse({'status': 'info',
                                     'message': f'{usuario_a_adicionar.nome_completo or usuario_a_adicionar.username} já é participante deste projeto.'})

            projeto.participantes.add(usuario_a_adicionar)

            return JsonResponse({
                'status': 'success',
                'message': f'{usuario_a_adicionar.nome_completo or usuario_a_adicionar.username} foi adicionado ao projeto "{projeto.nome}" com sucesso!',
                'membro_nome': usuario_a_adicionar.nome_completo or usuario_a_adicionar.username
            })

        except Projeto.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Projeto não encontrado.'}, status=404)
        except ValueError:  # Se projeto_id não for um inteiro/UUID válido
            return JsonResponse({'status': 'error', 'message': 'ID do projeto inválido.'}, status=400)
        except Exception as e:
            return JsonResponse(
                {'status': 'error', 'message': f'Ocorreu um erro no servidor. Por favor, tente novamente.'}, status=500)

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
def salvar_configuracoes_projeto_ajax(request, projeto_id):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Método não permitido.'}, status=405)

    projeto = get_object_or_404(Projeto, id=projeto_id)

    try:
        nome_projeto = request.POST.get('nome')
        descricao_projeto = request.POST.get('descricao')
        readme_projeto = request.POST.get('readme')

        if not nome_projeto or not nome_projeto.strip():
            return JsonResponse({'status': 'error', 'message': 'O nome do projeto não pode ser vazio.'}, status=400)

        projeto.nome = nome_projeto.strip()
        projeto.descricao = descricao_projeto.strip()
        projeto.observacoes = readme_projeto.strip()
        projeto.save()

        return JsonResponse({'status': 'success', 'message': 'Alterações salvas com sucesso!'})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Ocorreu um erro no servidor: {str(e)}'}, status=500)


@require_http_methods(["GET", "POST"])
def manage_sprints_ajax(request, projeto_id):
    projeto = get_object_or_404(Projeto, id=projeto_id)
    if request.method == 'POST':
        if request.user != projeto.responsavel:
            return JsonResponse({'status': 'error', 'message': 'Permissão negada para alterar.'}, status=403)

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

            raw_duration = data.get('duration')
            try:
                duration = int(raw_duration) if raw_duration else projeto.iteration_duration
            except (ValueError, TypeError):
                duration = projeto.iteration_duration

            unit = data.get('unit', projeto.iteration_unit)

            try:
                start_date = date.fromisoformat(start_date_str) if start_date_str else date.today()
            except (ValueError, TypeError):
                last_sprint = projeto.sprints.order_by('-data_fim').first()
                start_date = last_sprint.data_fim + timedelta(
                    days=1) if last_sprint and last_sprint.data_fim else date.today()

            if unit == 'weeks':
                end_date = start_date + timedelta(weeks=duration)
            else:
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
    # Permite que qualquer participante do projeto possa ver os sprints
    if not (projeto.responsavel == request.user or projeto.participantes.filter(id=request.user.id).exists()):
        return JsonResponse({'status': 'error', 'message': 'Permissão negada para ver.'}, status=403)

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
            'data_inicio': sprint.data_inicio.strftime('%b %d') if sprint.data_inicio else 'N/A',
            'data_fim': sprint.data_fim.strftime('%b %d, %Y') if sprint.data_fim else 'N/A',
            'status': status_display
        })

    return JsonResponse({
        'status': 'success',
        'settings': {'duration': projeto.iteration_duration, 'unit': projeto.iteration_unit},
        'sprints': sprints_list
    })

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
            else:  # edit
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
def fechar_projeto(request, projeto_id):
    projeto = get_object_or_404(Projeto, id=projeto_id)
    if projeto.responsavel != request.user:
        return JsonResponse({'status': 'error', 'message': 'Permissão negada.'}, status=403)

    projeto.ativo = False
    projeto.status = StatusProjetoChoices.FECHADO
    projeto.save()

    return JsonResponse(
        {'status': 'success', 'message': 'Projeto fechado com sucesso!', 'redirect_url': reverse('public:index')})


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
def deletar_projeto(request, projeto_id):
    projeto = get_object_or_404(Projeto, id=projeto_id)
    if projeto.responsavel != request.user:
        return JsonResponse({'status': 'error', 'message': 'Permissão negada.'}, status=403)

    projeto.delete()

    return JsonResponse(
        {'status': 'success', 'message': 'Projeto deletado permanentemente.', 'redirect_url': reverse('public:index')})

@login_required
def get_project_milestones_ajax(request, projeto_id):
    """
    Retorna os milestones ABERTOS de um projeto.
    """
    projeto = get_object_or_404(Projeto, id=projeto_id)

    # Verifica se o usuário tem permissão para ver o projeto
    if not (projeto.responsavel == request.user or projeto.participantes.filter(id=request.user.id).exists()):
        return JsonResponse({'status': 'error', 'message': 'Permissão negada.'}, status=403)

    # Filtra por milestones abertos
    milestones = Milestone.objects.filter(
        projeto=projeto,
        status=StatusMilestoneChoices.OPEN
    ).values('id', 'nome').order_by('data_limite')

    return JsonResponse({'status': 'success', 'milestones': list(milestones)})


@login_required
@require_http_methods(["GET", "POST"])
def manage_priorities_ajax(request, projeto_id):
    """
    Gerencia as prioridades de um projeto (CRUD e reordenação).
    """
    projeto = get_object_or_404(Projeto, id=projeto_id)

    # Apenas o responsável pelo projeto pode modificar
    if request.user != projeto.responsavel:
        return JsonResponse({'status': 'error', 'message': 'Permissão negada.'}, status=403)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            action = data.get('action')

            if action == 'add':
                nome = data.get('nome')  # CORRIGIDO: de 'name' para 'nome'
                if not nome or not nome.strip():
                    return JsonResponse({'status': 'error', 'message': 'O nome da prioridade é obrigatório.'},
                                        status=400)

                # Define a ordem para ser a última
                last_order = Prioridade.objects.filter(projeto=projeto).aggregate(Max('ordem'))[
                                 'ordem__max'] or 0

                nova_prioridade = Prioridade.objects.create(
                    projeto=projeto,
                    nome=nome.strip(),
                    ordem=last_order + 1,
                    # Adicione valores padrão se necessário
                    cor='#808080'  # Ex: cinza padrão
                )
                return JsonResponse({
                    'status': 'success',
                    'message': 'Prioridade adicionada!',
                    'prioridade': {
                        'id': nova_prioridade.id,
                        'nome': nova_prioridade.nome,
                        'descricao': nova_prioridade.descricao,
                        'cor': nova_prioridade.cor,
                        'ordem': nova_prioridade.ordem
                    }
                })

            elif action == 'update':
                p_id = data.get('id')
                prioridade = get_object_or_404(Prioridade, id=p_id, projeto=projeto)

                prioridade.nome = data.get('nome', prioridade.nome).strip()  # CORRIGIDO: de 'name' para 'nome'
                prioridade.descricao = data.get('description', prioridade.descricao)
                prioridade.cor = data.get('color', prioridade.cor)
                prioridade.save()

                return JsonResponse({'status': 'success', 'message': 'Prioridade atualizada!'})

            elif action == 'reorder':
                priority_ids = data.get('order', [])
                with transaction.atomic():
                    for index, p_id in enumerate(priority_ids):
                        Prioridade.objects.filter(id=p_id, projeto=projeto).update(ordem=index)
                return JsonResponse({'status': 'success', 'message': 'Ordem das prioridades salva!'})

            elif action == 'delete':
                p_id = data.get('id')
                get_object_or_404(Prioridade, id=p_id, projeto=projeto).delete()
                return JsonResponse({'status': 'success', 'message': 'Prioridade removida.'})

        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Dados JSON inválidos.'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

    # GET request para carregar as prioridades existentes
    prioridades = Prioridade.objects.filter(projeto=projeto).order_by('ordem')
    data = [{
        'id': p.id,
        'nome': p.nome,
        'descricao': p.descricao,
        'cor': p.cor,
        'ordem': p.ordem
    } for p in prioridades]

    return JsonResponse({'status': 'success', 'prioridades': data})


@login_required
@require_http_methods(["GET", "POST"])
def manage_sizes_ajax(request, projeto_id):
    """
    Gerencia os tamanhos de um projeto (CRUD e reordenação).
    """
    projeto = get_object_or_404(Projeto, id=projeto_id)

    # Apenas o responsável pelo projeto pode modificar
    if request.user != projeto.responsavel:
        return JsonResponse({'status': 'error', 'message': 'Permissão negada.'}, status=403)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            action = data.get('action')

            if action == 'add':
                nome = data.get('nome')
                if not nome or not nome.strip():
                    return JsonResponse({'status': 'error', 'message': 'O nome do tamanho é obrigatório.'},
                                        status=400)

                # Define a ordem para ser a última
                last_order = Tamanho.objects.filter(projeto=projeto).aggregate(Max('ordem'))[
                                 'ordem__max'] or 0

                novo_tamanho = Tamanho.objects.create(
                    projeto=projeto,
                    nome=nome.strip(),
                    ordem=last_order + 1,
                    cor='#808080'
                )
                return JsonResponse({
                    'status': 'success',
                    'message': 'Tamanho adicionado!',
                    'tamanho': {
                        'id': novo_tamanho.id,
                        'nome': novo_tamanho.nome,
                        'descricao': novo_tamanho.descricao,
                        'cor': novo_tamanho.cor,
                        'ordem': novo_tamanho.ordem
                    }
                })

            elif action == 'update':
                t_id = data.get('id')
                tamanho = get_object_or_404(Tamanho, id=t_id, projeto=projeto)

                tamanho.nome = data.get('nome', tamanho.nome).strip()
                tamanho.descricao = data.get('description', tamanho.descricao)
                tamanho.cor = data.get('color', tamanho.cor)
                tamanho.save()

                return JsonResponse({'status': 'success', 'message': 'Tamanho atualizado!'})

            elif action == 'reorder':
                size_ids = data.get('order', [])
                with transaction.atomic():
                    for index, t_id in enumerate(size_ids):
                        Tamanho.objects.filter(id=t_id, projeto=projeto).update(ordem=index)
                return JsonResponse({'status': 'success', 'message': 'Ordem dos tamanhos salva!'})

            elif action == 'delete':
                t_id = data.get('id')
                get_object_or_404(Tamanho, id=t_id, projeto=projeto).delete()
                return JsonResponse({'status': 'success', 'message': 'Tamanho removido.'})

        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Dados JSON inválidos.'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

    # GET request para carregar os tamanhos existentes
    tamanhos = Tamanho.objects.filter(projeto=projeto).order_by('ordem')
    data = [{
        'id': t.id,
        'nome': t.nome,
        'descricao': t.descricao,
        'cor': t.cor,
        'ordem': t.ordem
    } for t in tamanhos]

    return JsonResponse({'status': 'success', 'tamanhos': data})


@login_required
@require_http_methods(["GET", "POST"])
def manage_labels_ajax(request, projeto_id):
    projeto = get_object_or_404(Projeto, id=projeto_id)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            action = data.get('action')

            if action == 'create':
                nome = data.get('name', '').strip()
                if not nome:
                    return JsonResponse({'status': 'error', 'message': 'O nome da label é obrigatório.'}, status=400)

                nova_label = Tag.objects.create(
                    projeto=projeto,
                    nome=nome,
                    descricao=data.get('description', ''),
                    cor=data.get('color', '#d73a4a')
                )
                return JsonResponse({
                    'status': 'success',
                    'message': 'Label criada com sucesso!',
                    'label': {'id': nova_label.id, 'name': nova_label.nome, 'description': nova_label.descricao,
                              'color': nova_label.cor}
                })

            elif action == 'update':
                label_id = data.get('id')
                label = get_object_or_404(Tag, id=label_id, projeto=projeto)
                label.nome = data.get('name', label.nome).strip()
                label.descricao = data.get('description', label.descricao)
                label.cor = data.get('color', label.cor)
                label.save()
                return JsonResponse({'status': 'success', 'message': 'Label atualizada!'})

            elif action == 'delete':
                label_id = data.get('id')
                get_object_or_404(Tag, id=label_id, projeto=projeto).delete()
                return JsonResponse({'status': 'success', 'message': 'Label removida.'})

        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Dados JSON inválidos.'}, status=400)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

    labels = Tag.objects.filter(projeto=projeto).order_by('nome')
    data = [{'id': l.id, 'name': l.nome, 'description': l.descricao, 'color': l.cor} for l in labels]
    return JsonResponse({'status': 'success', 'labels': data})
@login_required
@require_http_methods(["POST"])
def mover_tarefa_ajax(request):
    try:
        data = json.loads(request.body)
        tarefa_id = data.get('tarefa_id')
        nova_coluna_id = data.get('nova_coluna_id')

        if not tarefa_id or not nova_coluna_id:
            return JsonResponse({'status': 'error', 'message': 'IDs da tarefa e da coluna são obrigatórios.'},
                                status=400)

        tarefa = get_object_or_404(Tarefa, id=tarefa_id)
        nova_coluna = get_object_or_404(Coluna, id=nova_coluna_id)

        # Verificação de permissão: o usuário deve ser do projeto
        projeto = tarefa.projeto
        if not (projeto.responsavel == request.user or projeto.participantes.filter(id=request.user.id).exists()):
            return JsonResponse({'status': 'error', 'message': 'Você não tem permissão para modificar este projeto.'},
                                status=403)

        # Verificação de consistência: a coluna deve pertencer ao mesmo projeto da tarefa
        if nova_coluna.projeto != projeto:
            return JsonResponse({'status': 'error', 'message': 'Movimentação inválida entre projetos diferentes.'},
                                status=400)

        # Atualiza a coluna da tarefa
        tarefa.coluna = nova_coluna
        tarefa.save(update_fields=['coluna'])

        return JsonResponse({'status': 'success', 'message': 'Tarefa movida com sucesso!'})

    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'JSON inválido.'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'Ocorreu um erro: {str(e)}'}, status=500)


@login_required
@require_http_methods(["POST"])
def update_task_sidebar_ajax(request, tarefa_id):
    try:
        tarefa = get_object_or_404(Tarefa, id=tarefa_id)
        projeto = tarefa.projeto

        # Verificação de permissão
        if not (projeto.responsavel == request.user or projeto.participantes.filter(id=request.user.id).exists()):
            return JsonResponse({'status': 'error', 'message': 'Permissão negada.'}, status=403)

        data = json.loads(request.body)
        attribute = data.get('attribute')
        value = data.get('value')

        new_data_response = None

        if attribute == 'responsaveis':
            tarefa.responsaveis.clear()
            if value:
                users = UsuarioPersonalizado.objects.filter(id__in=value, tipo_usuario='aluno')
                tarefa.responsaveis.add(*users)
            new_data_response = list(tarefa.responsaveis.values('id', 'nome_completo', 'matricula'))

        elif attribute == 'tags':
            tarefa.tags.clear()
            if value:
                tags = Tag.objects.filter(id__in=value, projeto=projeto)
                tarefa.tags.add(*tags)
            new_data_response = list(tarefa.tags.values('id', 'nome', 'cor'))

        elif attribute == 'milestone':
            if value:
                milestone = get_object_or_404(Milestone, id=value, projeto=projeto)
                tarefa.milestone = milestone
            else:
                tarefa.milestone = None
            tarefa.save()
            new_data_response = _get_milestone_data(tarefa.milestone) if tarefa.milestone else None

        elif attribute == 'sprint':
            if value:
                sprint = get_object_or_404(Sprint, id=value, projeto=projeto)
                tarefa.sprint = sprint
            else:
                tarefa.sprint = None
            tarefa.save()
            new_data_response = {'id': tarefa.sprint.id, 'nome': tarefa.sprint.nome} if tarefa.sprint else None

        elif attribute == 'prioridade':
            if value:
                prioridade = get_object_or_404(Prioridade, id=value, projeto=projeto)
                tarefa.prioridade = prioridade
            else:
                tarefa.prioridade = None
            tarefa.save()
            new_data_response = {'id': tarefa.prioridade.id, 'nome': tarefa.prioridade.nome,
                                 'cor': tarefa.prioridade.cor} if tarefa.prioridade else None

        elif attribute == 'tamanho':
            if value:
                tamanho = get_object_or_404(Tamanho, id=value, projeto=projeto)
                tarefa.tamanho = tamanho
            else:
                tarefa.tamanho = None
            tarefa.save()
            new_data_response = {'id': tarefa.tamanho.id, 'nome': tarefa.tamanho.nome,
                                 'cor': tarefa.tamanho.cor} if tarefa.tamanho else None

        else:
            return JsonResponse({'status': 'error', 'message': 'Atributo desconhecido.'}, status=400)

        return JsonResponse({'status': 'success', 'message': 'Tarefa atualizada!', 'new_data': new_data_response})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
def get_task_details_ajax(request, tarefa_id):
    try:
        tarefa = get_object_or_404(Tarefa, id=tarefa_id)
        projeto = tarefa.projeto

        # Verifica se o usuário tem permissão para ver a tarefa
        if not (projeto.responsavel == request.user or projeto.participantes.filter(id=request.user.id).exists()):
            return JsonResponse({'status': 'error', 'message': 'Permissão negada.'}, status=403)

        # Converte o objeto Tarefa para um dicionário
        tarefa_data = model_to_dict(tarefa)
        tarefa_data['numero_tarefa_projeto'] = tarefa.numero_tarefa_projeto
        # Converte a descrição de Markdown para HTML
        tarefa_data['descricao'] = tarefa.descricao if tarefa.descricao else ''
        tarefa_data['projeto_id'] = tarefa.projeto.id  # Adiciona o ID do projeto

        # Adiciona dados de campos ForeignKey
        tarefa_data['milestone'] = _get_milestone_data(tarefa.milestone) if tarefa.milestone else None
        tarefa_data['prioridade'] = {'id': tarefa.prioridade.id, 'nome': tarefa.prioridade.nome,
                                     'cor': tarefa.prioridade.cor} if tarefa.prioridade else None
        tarefa_data['tamanho'] = {'id': tarefa.tamanho.id, 'nome': tarefa.tamanho.nome,
                                  'cor': tarefa.tamanho.cor} if tarefa.tamanho else None
        tarefa_data['sprint'] = {'nome': tarefa.sprint.nome, 'id': tarefa.sprint.id} if tarefa.sprint else None

        # Adiciona dados de campos ManyToMany
        tarefa_data['responsaveis'] = list(tarefa.responsaveis.values('id', 'nome_completo', 'matricula'))
        tarefa_data['tags'] = list(tarefa.tags.values('id', 'nome', 'cor'))

        # Pega os IDs para o estado inicial da seleção na barra lateral
        tarefa_data['responsaveis_ids'] = list(tarefa.responsaveis.values_list('id', flat=True))
        tarefa_data['tags_ids'] = list(tarefa.tags.values_list('id', flat=True))


        # Adiciona comentários
        comentarios = list(tarefa.comentarios.order_by('data_criacao').values(
            'conteudo',
            'data_criacao',
            'autor__nome_completo',
            'autor__matricula'
        ))

        # Formata a data e o conteúdo do comentário
        for comentario in comentarios:
            comentario['data_criacao'] = comentario['data_criacao'].strftime('%d de %b, %Y às %H:%M')

        # Monta a resposta final
        response_data = {
            'status': 'success',
            'tarefa': tarefa_data,
            'comentarios': comentarios
        }

        return JsonResponse(response_data, encoder=DjangoJSONEncoder)

    except Tarefa.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Tarefa não encontrada.'}, status=404)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@login_required
def get_project_sprints_ajax(request, projeto_id):
    """
    Retorna os sprints de um projeto para seleção.
    """
    projeto = get_object_or_404(Projeto, id=projeto_id)
    if not (projeto.responsavel == request.user or projeto.participantes.filter(id=request.user.id).exists()):
        return JsonResponse({'status': 'error', 'message': 'Permissão negada.'}, status=403)

    sprints = Sprint.objects.filter(projeto=projeto).order_by('data_inicio').values('id', 'nome')
    return JsonResponse({'status': 'success', 'sprints': list(sprints)})

@login_required
def get_board_state_ajax(request, projeto_id):
    """
    Retorna o estado completo do quadro (todas as tarefas visíveis) para
    atualização periódica do frontend.
    """
    try:
        projeto = get_object_or_404(Projeto, id=projeto_id)

        # Validação de permissão
        if not (projeto.responsavel == request.user or projeto.participantes.filter(id=request.user.id).exists()):
            return JsonResponse({'status': 'error', 'message': 'Permissão negada.'}, status=403)

        # Usamos prefetch_related e select_related para otimizar a consulta
        tarefas = Tarefa.objects.filter(projeto=projeto).select_related(
            'prioridade', 'tamanho', 'sprint'
        ).prefetch_related('tags')

        tarefas_data = []
        for t in tarefas:
            tarefas_data.append({
                'id': t.id,
                'titulo': t.titulo,
                'coluna_id': t.coluna_id,
                'numero_tarefa_projeto': t.numero_tarefa_projeto,
                'projeto_nome': t.projeto.nome,
                'prioridade': {'id': t.prioridade.id, 'nome': t.prioridade.nome, 'cor': t.prioridade.cor} if t.prioridade else None,
                'tamanho': {'id': t.tamanho.id, 'nome': t.tamanho.nome, 'cor': t.tamanho.cor} if t.tamanho else None,
                'sprint': {'id': t.sprint.id, 'nome': t.sprint.nome} if t.sprint else None,
                'tags': list(t.tags.values('id', 'nome', 'cor')),
            })

        return JsonResponse({'status': 'success', 'tasks': tarefas_data})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


def _get_milestone_data(milestone):
    if not milestone:
        return None

    total_tasks = milestone.tarefas.count()
    completed_tasks = 0

    try:
        coluna_concluido = Coluna.objects.get(projeto=milestone.projeto, nome__iexact='Complete')
        completed_tasks = milestone.tarefas.filter(coluna=coluna_concluido).count()
    except Coluna.DoesNotExist:
        completed_tasks = 0
    return {
        'id': milestone.id,
        'nome': milestone.nome,
        'data_limite': milestone.data_limite,
        'completed_tasks': completed_tasks,
        'total_tasks': total_tasks
    }

@login_required
def get_project_details_ajax(request, projeto_id):
    try:
        projeto = get_object_or_404(Projeto, id=projeto_id)

        # Validação de permissão
        if not (projeto.responsavel == request.user or projeto.participantes.filter(id=request.user.id).exists()):
            return JsonResponse({'status': 'error', 'message': 'Permissão negada.'}, status=403)

        # Converte a descrição README de Markdown para HTML
        readme_html = markdown.markdown(projeto.observacoes) if projeto.observacoes else "<p><i>Nenhum README fornecido.</i></p>"

        details = {
            'nome': projeto.nome,
            'descricao': projeto.descricao or "Nenhuma descrição fornecida.",
            'readme_html': readme_html,
            'status': projeto.get_status_display(),
            'data_inicio': projeto.data_inicio.strftime('%d/%m/%Y') if projeto.data_inicio else 'Não definida',
            'data_limite': projeto.data_limite.strftime('%d/%m/%Y') if projeto.data_limite else 'Não definida',
        }
        return JsonResponse({'status': 'success', 'details': details})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)