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


class ProjetoTestCase(TestCase):
    """Testes para o modelo Projeto"""

    def setUp(self):
        """Configuração executada antes de cada teste"""
        self.professor = self.criar_usuario_professor()
        self.alunos = self.criar_usuarios_alunos()

    def criar_usuario_professor(self):
        """Cria usuário professor real para testes"""
        return UsuarioPersonalizado.objects.create_user(
            matricula="12345678",
            username="prof.carlos",
            email="carlos.santos@ufrrj.br",
            password="senha123",
            tipo_usuario="professor"
        )

    def criar_usuarios_alunos(self):
        """Cria usuários alunos reais para testes"""
        alunos = []
        nomes_dados = [
            ("joao.silva", "joao.silva@estudante.ufrrj.br", "ALU001"),
            ("maria.oliveira", "maria.oliveira@estudante.ufrrj.br", "ALU002"),
            ("pedro.costa", "pedro.costa@estudante.ufrrj.br", "ALU003")
        ]

        for username, email, matricula in nomes_dados:
            aluno = UsuarioPersonalizado.objects.create_user(
                matricula=matricula,
                username=username,
                email=email,
                password="senha123",
                tipo_usuario="aluno"
            )
            alunos.append(aluno)

        return alunos

    def test_criacao_projeto_basico(self):
        """Teste de criação básica de projeto"""
        projeto = Projeto.objects.create(
            nome="Sistema de Biblioteca Digital",
            descricao="Sistema para gerenciamento de biblioteca digital",
            responsavel=self.professor
        )

        self.assertEqual(projeto.nome, "Sistema de Biblioteca Digital")
        self.assertEqual(projeto.responsavel, self.professor)
        self.assertEqual(projeto.descricao, "Sistema para gerenciamento de biblioteca digital")

    def test_adicionar_participante(self):
        """Teste de adição de participantes"""
        projeto = Projeto.objects.create(
            nome="Projeto Teste",
            descricao="Teste de participantes",
            responsavel=self.professor
        )

        # Adicionar primeiro aluno
        projeto.participantes.add(self.alunos[0])
        self.assertEqual(projeto.participantes.count(), 1)
        self.assertIn(self.alunos[0], projeto.participantes.all())

        # Tentar adicionar o mesmo aluno novamente (Django não permite duplicados por padrão)
        projeto.participantes.add(self.alunos[0])
        self.assertEqual(projeto.participantes.count(), 1)  # Deve continuar sendo 1

    def test_adicionar_multiplos_participantes(self):
        """Teste de adição de múltiplos participantes"""
        projeto = Projeto.objects.create(
            nome="Projeto Teste",
            descricao="Teste de múltiplos participantes",
            responsavel=self.professor
        )

        for aluno in self.alunos:
            projeto.participantes.add(aluno)

        self.assertEqual(projeto.participantes.count(), len(self.alunos))
        for aluno in self.alunos:
            self.assertIn(aluno, projeto.participantes.all())

    def test_projeto_sem_responsavel(self):
        """Teste criação de projeto sem responsável deve falhar"""
        with self.assertRaises(Exception):
            projeto = Projeto(
                nome="Projeto Inválido",
                descricao="Projeto sem responsável",
                responsavel=None
            )
            projeto.full_clean()  # Força a validação

    def test_relacao_projeto_responsavel(self):
        """Teste da relação between projeto e responsável"""
        projeto = Projeto.objects.create(
            nome="Projeto Relação",
            descricao="Teste de relação",
            responsavel=self.professor
        )

        # Verifica se o projeto foi associado ao professor
        self.assertEqual(projeto.responsavel, self.professor)

        # Verifica se o professor tem o projeto associado (se houver related_name)
        # Assumindo que existe um related_name='projetos_responsavel' ou similar
        if hasattr(self.professor, 'projetos_responsavel'):
            self.assertIn(projeto, self.professor.projetos_responsavel.all())