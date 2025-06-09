from django.urls import path
from . import views

app_name = 'public'

urlpatterns = [
    path('', views.index, name='index'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('login/', views.login, name='login'),
    path('cadastro/', views.cadastro, name='cadastro'),
    path('criar-projeto-ajax/', views.criar_projeto_ajax, name='criar_projeto_ajax'),
    path('adicionar-membro-ajax/', views.adicionar_membro_ajax, name='adicionar_membro_ajax'),
    path('criar-tarefa-ajax/', views.criar_tarefa_ajax, name='criar_tarefa_ajax'),
    path('projeto/<int:projeto_id>/participantes/', views.get_project_participants_ajax, name='get_project_participants_ajax'),
    path('projeto/<int:projeto_id>/milestones/', views.get_project_milestones_ajax, name='get_project_milestones_ajax'),
    path('projeto/<int:projeto_id>/configuracao/', views.configuracao, name='configuracao'),
    path('projeto/<int:projeto_id>/salvar-configuracoes-ajax/', views.salvar_configuracoes_projeto_ajax, name='salvar_configuracoes_projeto_ajax'),
    path('projeto/<int:projeto_id>/sprints-ajax/', views.manage_sprints_ajax, name='manage_sprints_ajax'),
    path('projeto/<int:projeto_id>/milestones-ajax/', views.manage_milestones_ajax, name='manage_milestones_ajax'),
    path('projeto/<int:projeto_id>/fechar/', views.fechar_projeto, name='fechar_projeto'),
    path('projeto/<int:projeto_id>/deletar/', views.deletar_projeto, name='deletar_projeto'),
    path('projeto/<int:projeto_id>/prioridades-ajax/', views.manage_priorities_ajax, name='manage_priorities_ajax'),
    path('projeto/<int:projeto_id>/tamanhos-ajax/', views.manage_sizes_ajax, name='manage_sizes_ajax'),
]
