# public/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class UsuarioPersonalizado(AbstractUser):

    USERNAME_FIELD = 'matricula'
    REQUIRED_FIELDS = ['email', 'username'] # 'email' e 'username' seriam campos obrigatórios ao criar superusuário.

    # Campo 'matricula'
    matricula = models.CharField(
        max_length=50,
        unique=True,
        blank=True, # Permite que seja vazio, dependendo de como você usa USERNAME_FIELD
        null=True,  # Permite que seja nulo no banco de dados
        help_text="Matrícula única do usuário."
    )

    # Campo 'nome_completo'
    nome_completo = models.CharField(
        max_length=255,
        blank=True,
        help_text="Nome completo do usuário."
    )

    # Campo 'tipo_usuario' para diferenciar Aluno/Professor no mesmo modelo base
    TIPO_USUARIO_CHOICES = (
        ('aluno', 'Aluno'),
        ('professor', 'Professor'),
    )
    tipo_usuario = models.CharField(
        max_length=10,
        choices=TIPO_USUARIO_CHOICES,
        default='aluno',
        help_text="Define se o usuário é um aluno ou um professor."
    )

    class Meta:
        verbose_name = "Usuário Personalizado"
        verbose_name_plural = "Usuários Personalizados"

    def __str__(self):
        # Uma representação amigável do objeto
        if self.nome_completo:
            return self.nome_completo
        return self.username or self.email or str(self.matricula)

# ---

class PerfilProfessor(models.Model):
    # Um perfil para professores, vinculado 1 para 1 ao UsuarioPersonalizado
    usuario = models.OneToOneField(
        UsuarioPersonalizado,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='perfil_professor',
        limit_choices_to={'tipo_usuario': 'professor'} # Garante que só professores tenham este perfil
    )
    departamento = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Departamento ao qual o professor pertence."
    )
    titulacao = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Titulação acadêmica do professor (ex: Dr., Ms.)."
    )

    class Meta:
        verbose_name = "Perfil de Professor"
        verbose_name_plural = "Perfis de Professores"

    def __str__(self):
        return f"Perfil de Professor para {self.usuario.get_full_name()}"

class PerfilAluno(models.Model):
    # Um perfil para alunos, vinculado 1 para 1 ao UsuarioPersonalizado
    usuario = models.OneToOneField(
        UsuarioPersonalizado,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='perfil_aluno',
        limit_choices_to={'tipo_usuario': 'aluno'} # Garante que só alunos tenham este perfil
    )
    curso = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Curso em que o aluno está matriculado."
    )
    semestre = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Semestre atual do aluno."
    )

    class Meta:
        verbose_name = "Perfil de Aluno"
        verbose_name_plural = "Perfis de Alunos"

    def __str__(self):
        return f"Perfil de Aluno para {self.usuario.get_full_name()}"