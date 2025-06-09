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
    path('projeto/<int:projeto_id>/configuracao/', views.configuracao, name='configuracao'),
    path('projeto/<int:projeto_id>/sprints-ajax/', views.manage_sprints_ajax, name='manage_sprints_ajax'),
]
