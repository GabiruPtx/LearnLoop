from django.test import TestCase
from django.utils import timezone
from public.models import (
    UsuarioPersonalizado, Projeto, Tarefa, Comentario,
    StatusTarefaChoices, TipoVisibilidadeChoices
)
from .models import UsuarioPersonalizado, PerfilAluno, PerfilProfessor, StatusTarefaChoices, TipoVisibilidadeChoices, Projeto, Tarefa, Comentario # Adicionado Projeto, Tarefa, Comentario
from .forms import CadastroForm
class ModelsTestCase(TestCase):

    def setUp(self):
        # Criar usuário
        self.usuario = UsuarioPersonalizado.objects.create_user(
            matricula="12345",
            username="testeuser",
            email="teste@example.com",
            password="senha123",
            tipo_usuario="aluno"
        )

        # Criar projeto
        self.projeto = Projeto.objects.create(
            nome="Projeto Teste",
            descricao="Um projeto de teste.",
            responsavel=self.usuario
        )
        self.projeto.participantes.add(self.usuario)

        # Criar tarefa
        self.tarefa = Tarefa.objects.create(
            titulo="Tarefa Teste",
            descricao="Descrição da tarefa.",
            status=StatusTarefaChoices.PENDENTE,
            projeto=self.projeto,
            visibilidade=TipoVisibilidadeChoices.PUBLICA
        )
        self.tarefa.responsaveis.add(self.usuario)

        # Criar comentário
        self.comentario = Comentario.objects.create(
            conteudo="Comentário de teste",
            autor=self.usuario,
            tarefa=self.tarefa,
            visibilidade=TipoVisibilidadeChoices.PUBLICA
        )

    def test_usuario_criado(self):
        self.assertEqual(self.usuario.username, "testeuser")
        self.assertTrue(self.usuario.check_password("senha123"))

    def test_projeto_criado(self):
        self.assertEqual(self.projeto.nome, "Projeto Teste")
        self.assertEqual(self.projeto.responsavel, self.usuario)

    def test_tarefa_criada(self):
        self.assertEqual(self.tarefa.titulo, "Tarefa Teste")
        self.assertEqual(self.tarefa.projeto, self.projeto)
        self.assertIn(self.usuario, self.tarefa.responsaveis.all())

    def test_comentario_criado(self):
        self.assertEqual(self.comentario.conteudo, "Comentário de teste")
        self.assertEqual(self.comentario.autor, self.usuario)
        self.assertEqual(self.comentario.tarefa, self.tarefa)


