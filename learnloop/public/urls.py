from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
app_name = 'public'

urlpatterns = [
    path('', views.index, name='index'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('login/', views.login, name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='public:login'), name='logout'),
    path('cadastro/', views.cadastro, name='cadastro'),
    path('criar-projeto-ajax/', views.criar_projeto_ajax, name='criar_projeto_ajax'),
    path('criar-tarefa-ajax/', views.criar_tarefa_ajax, name='criar_tarefa_ajax'),
    path('projeto/<int:projeto_id>/participantes/', views.get_projeto_participantes_ajax, name='get_project_participants_ajax'),
    path('projeto/<int:projeto_id>/milestones/', views.get_projeto_milestones_ajax, name='get_project_milestones_ajax'),
    path('projeto/<int:projeto_id>/configuracao/', views.configuracao, name='configuracao'),
    path('projeto/<int:projeto_id>/salvar-configuracoes-ajax/', views.salvar_configuracoes_projeto_ajax, name='salvar_configuracoes_projeto_ajax'),
    path('projeto/<int:projeto_id>/sprints-ajax/', views.gerenciar_sprints_ajax, name='manage_sprints_ajax'),
    path('projeto/<int:projeto_id>/milestones-ajax/', views.gerenciar_milestones_ajax, name='manage_milestones_ajax'),
    path('projeto/<int:projeto_id>/search-users/', views.buscar_usuarios_ajax, name='search_users_ajax'),
    path('projeto/<int:projeto_id>/manage-collaborators/', views.gerenciar_participantes_ajax, name='manage_collaborators_ajax'),
    path('projeto/<int:projeto_id>/fechar/', views.fechar_projeto, name='fechar_projeto'),
    path('projeto/<int:projeto_id>/deletar/', views.deletar_projeto, name='deletar_projeto'),
    path('projeto/<int:projeto_id>/prioridades-ajax/', views.gerenciar_prioridades_ajax, name='manage_priorities_ajax'),
    path('projeto/<int:projeto_id>/tamanhos-ajax/', views.gerenciar_tamanhos_ajax, name='manage_sizes_ajax'),
    path('tarefa/<int:tarefa_id>/editar-ajax/', views.editar_tarefa_ajax, name='editar_tarefa_ajax'),

    path('projeto/<int:projeto_id>/labels-ajax/', views.gerenciar_labels_ajax, name='manage_labels_ajax'),
    path('tarefa/mover/', views.mover_tarefa_ajax, name='mover_tarefa_ajax'),
    path('tarefa/<int:tarefa_id>/detalhes/', views.get_tarefa_detalhes_ajax, name='get_task_details_ajax'),
    path('tarefa/<int:tarefa_id>/update-sidebar/', views.atualizar_tarefa_sidebar_ajax, name='update_task_sidebar_ajax'),
    path('projeto/<int:projeto_id>/board-state/', views.get_quadro_estado_ajax, name='get_board_state_ajax'),
    path('projeto/<int:projeto_id>/detalhes-ajax/', views.get_projeto_detalhes_ajax, name='get_project_details_ajax'),
    path('perfil/', views.perfil, name='perfil'),
    path('perfil/update-ajax/', views.atualizar_perfil_ajax, name='update_perfil_ajax'),
    path('perfil/get-avatars-ajax/', views.get_avatars_ajax, name='get_avatars_ajax'),
    path('projeto/<int:projeto_id>/save-feedback-ajax/', views.salvar_projeto_feedback_ajax, name='save_project_feedback_ajax'),
    path('perfil/projeto/<int:projeto_id>/notas-ajax/', views.get_notas_projeto_ajax, name='get_notas_projeto_ajax'),
    path('projeto/<int:projeto_id>/roadmap-data-ajax/', views.get_roadmap_dados_ajax, name='get_roadmap_data_ajax'),
    path('projeto/<int:projeto_id>/update-status-ajax/', views.atualizar_projeto_status_ajax, name='update_project_status_ajax'),
    path('tarefa/<int:tarefa_id>/comentar-ajax/', views.adicionar_comentario_ajax, name='adicionar_comentario_ajax'),
    path('tarefa/<int:tarefa_id>/deletar-ajax/', views.deletar_tarefa_ajax, name='deletar_tarefa_ajax'),
    path('coluna/<int:coluna_id>/deletar-itens-ajax/', views.deletar_itens_coluna_ajax,name='deletar_itens_coluna_ajax'),
]
