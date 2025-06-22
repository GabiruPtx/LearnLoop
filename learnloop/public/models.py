# public/models.pyAdd commentMore actions
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.db.models import Max

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
#Enumerates
class StatusProjetoChoices(models.TextChoices):
    PLANEJAMENTO = 'PLANEJAMENTO', 'Em Planejamento'
    EM_ANDAMENTO = 'EM_ANDAMENTO', 'Em Andamento'
    SUSPENSO = 'SUSPENSO', 'Suspenso'
    CONCLUIDO = 'CONCLUIDO', 'Concluído'
    CANCELADO = 'CANCELADO', 'Cancelado'

class StatusTarefaChoices(models.TextChoices):
    PENDENTE = 'PENDENTE', 'Pendente'
    EM_ANDAMENTO = 'EM_ANDAMENTO', 'Em Andamento'
    CONCLUIDA = 'CONCLUIDA', 'Concluída'
    CANCELADA = 'CANCELADA', 'Cancelada'

class StatusMilestoneChoices(models.TextChoices):
    OPEN = 'OPEN', 'Aberto'
    CLOSED = 'CLOSED', 'Fechado'

class NivelDificuldadeChoices(models.TextChoices):
    FACIL = 'FACIL', 'Fácil'
    MEDIO = 'MEDIO', 'Médio'
    DIFICIL = 'DIFICIL', 'Difícil'

class NivelPrioridadeChoices(models.TextChoices):
    BAIXA = 'BAIXA', 'Baixa'
    MEDIA = 'MEDIA', 'Média'
    ALTA = 'ALTA', 'Alta'
    URGENTE = 'URGENTE', 'Urgente'

class TamanhoTarefaChoices(models.TextChoices):
    PEQUENO = 'PEQUENO', 'Pequeno'
    MEDIO = 'MEDIO', 'Médio'
    GRANDE = 'GRANDE', 'Grande'

class TipoVisibilidadeChoices(models.TextChoices):
    PUBLICA = 'PUBLICA', 'Pública'
    ESPECIFICA = 'ESPECIFICA', 'Específica (visível apenas para envolvidos)'


#Model Projeto
class Projeto(models.Model):
    # Campos básicos
    nome = models.CharField(max_length=200)
    descricao = models.TextField(blank=True)
    data_criacao = models.DateTimeField(default=timezone.now)
    data_inicio = models.DateTimeField(null=True, blank=True)
    data_limite = models.DateTimeField(null=True, blank=True)
    data_ultima_atualizacao = models.DateTimeField(auto_now=True)
    iteration_duration = models.PositiveIntegerField(default=2)
    iteration_unit = models.CharField(max_length=10, default='weeks') # 'weeks' or 'days'

    status = models.CharField(
        max_length=20,
        choices=StatusProjetoChoices.choices,
        default=StatusProjetoChoices.PLANEJAMENTO
    )

    # Relacionamentos
    responsavel = models.ForeignKey(
        'UsuarioPersonalizado',
        on_delete=models.PROTECT,
        related_name='projetos_responsavel'
    )
    participantes = models.ManyToManyField(
        'UsuarioPersonalizado',
        related_name='projetos_participante'
    )
    # Configurações
    publico = models.BooleanField(default=True)
    ativo = models.BooleanField(default=True)
    versao = models.PositiveIntegerField(default=1)
    observacoes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'Projeto'
        verbose_name_plural = 'Projetos'
        ordering = ['-data_criacao']

    def save(self, *args, **kwargs):
        is_new = self._state.adding

        super().save(*args, **kwargs)

        if is_new:
            colunas_padrao = [
                {'nome': 'Back-Log', 'ordem': 0},
                {'nome': 'ToDo', 'ordem': 1},
                {'nome': 'In Progress', 'ordem': 2},
                {'nome': 'Complete', 'ordem': 3},
            ]
            for coluna_data in colunas_padrao:
                Coluna.objects.create(projeto=self, **coluna_data)

    def __str__(self):
        return f"{self.nome} ({self.get_status_display()})"

    def esta_ativo(self):
        return self.ativo

    def esta_em_prazo(self):
        if not self.data_limite:
            return True
        return timezone.now() <= self.data_limite

    def dias_restantes(self):
        if not self.data_limite:
            return None
        delta = self.data_limite - timezone.now()
        return delta.days


    def is_responsavel(self, usuario):
        return self.responsavel == usuario

    def is_participante(self, usuario):
        return self.participantes.filter(id=usuario.id).exists()

class Coluna(models.Model):
    nome = models.CharField(max_length=100)
    projeto = models.ForeignKey(Projeto, on_delete=models.CASCADE, related_name='colunas')
    ordem = models.PositiveIntegerField(default=0) # Para definir a ordem de exibição

    class Meta:
        ordering = ['ordem']

    def __str__(self):
        return f"{self.nome} ({self.projeto.nome})"

class Tag(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.CharField(max_length=255, blank=True, null=True, help_text="Descrição opcional para a tag.")
    cor = models.CharField(max_length=7, default='#d73a4a', help_text="Cor em formato hexadecimal, ex: #d73a4a")
    projeto = models.ForeignKey(
        Projeto,
        on_delete=models.CASCADE,
        related_name='tags_do_projeto'
    )

    class Meta:
        verbose_name = "Tag"
        verbose_name_plural = "Tags"
        unique_together = ('nome', 'projeto')
        ordering = ['nome']

    def __str__(self):
        projeto_nome = self.projeto.nome if hasattr(self.projeto, 'nome') else str(self.projeto_id)
        return f"{self.nome} (Projeto: {projeto_nome})"

class Milestone(models.Model):
    nome = models.CharField(
        max_length=255
    )
    descricao = models.TextField(
        blank=True,
        null=True
    )
    data_limite = models.DateField()
    projeto = models.ForeignKey(
        Projeto,
        on_delete=models.CASCADE,
        related_name='milestones'
    )

    status = models.CharField(
        max_length=10,
        choices=StatusMilestoneChoices.choices,
        default=StatusMilestoneChoices.OPEN
    )

    class Meta:
        verbose_name = "Milestone"
        verbose_name_plural = "Milestones"
        ordering = ['data_limite', 'nome']

    def __str__(self):
        projeto_nome = self.projeto.nome if hasattr(self.projeto, 'nome') else str(self.projeto_id)
        return f"{self.nome} (Projeto: {projeto_nome})"

class Sprint(models.Model):
    nome = models.CharField(
        max_length=255
    )
    data_inicio = models.DateField(
        null=True,
        blank=True
    )
    data_fim = models.DateField(
        null=True,
        blank=True
    )
    projeto = models.ForeignKey(
        Projeto,
        on_delete=models.CASCADE,
        related_name='sprints'
    )
    class Meta:
        verbose_name = "Sprint"
        verbose_name_plural = "Sprints"
        ordering = ['data_inicio', 'nome']

    def __str__(self):
        return self.nome

class Prioridade(models.Model):
    projeto = models.ForeignKey(Projeto, on_delete=models.CASCADE, related_name='prioridades')
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True)
    cor = models.CharField(max_length=7, default='#808080', help_text="Cor em formato hexadecimal, ex: #FF0000")
    ordem = models.PositiveIntegerField(default=0, help_text="Define a ordem de exibição da prioridade.")
    class Meta:
        verbose_name = "Prioridade"
        verbose_name_plural = "Prioridades"
        unique_together = ('projeto', 'nome')
        ordering = ['ordem','nome']

    def __str__(self):
        return self.nome

class Tamanho(models.Model):
    projeto = models.ForeignKey(Projeto, on_delete=models.CASCADE, related_name='tamanhos')
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True)
    cor = models.CharField(max_length=7, default='#808080', help_text="Cor em formato hexadecimal, ex: #FFFFFF")
    ordem = models.PositiveIntegerField(default=0, help_text="Define a ordem de exibição do tamanho.")
    class Meta:
        verbose_name = "Tamanho"
        verbose_name_plural = "Tamanhos"
        unique_together = ('projeto', 'nome')
        ordering = ['ordem', 'nome']

    def __str__(self):
        return self.nome

class Tarefa(models.Model):
    titulo = models.CharField(
        max_length=255
    )
    descricao = models.TextField(
        blank=True,
        null=True
    )
    numero_tarefa_projeto = models.PositiveIntegerField(
        editable=False,
        help_text="Número sequencial da tarefa dentro do projeto."
    )
    coluna = models.ForeignKey(Coluna,
        on_delete=models.CASCADE,
        related_name='tarefas',
        null=True)
    dificuldade = models.CharField(
        max_length=20,
        choices=NivelDificuldadeChoices.choices,
        blank=True,
        null=True
    )
    prioridade = models.ForeignKey(
        Prioridade,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='tarefas'
    )
    tamanho = models.ForeignKey(
        Tamanho,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='tarefas'
    )
    projeto = models.ForeignKey(
        Projeto,
        on_delete=models.CASCADE,
        related_name='tarefas'
    )
    responsaveis = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='tarefas_responsaveis',
        limit_choices_to={'tipo_usuario': 'aluno'},
        blank=True
    )
    tags = models.ManyToManyField(
        Tag,
        related_name='tarefas',
        blank=True
    )
    milestone = models.ForeignKey(
        Milestone,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='tarefas'
    )
    relacionamentos = models.ManyToManyField(
        'self',
        blank=True,
        symmetrical=True
    )
    especificacoes = models.TextField(
        blank=True,
        null=True
    )
    sprint = models.ForeignKey(
        Sprint,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tarefas'
    )
    visibilidade = models.CharField(
        max_length=20,
        choices=TipoVisibilidadeChoices.choices,
        default=TipoVisibilidadeChoices.PUBLICA
    )
    nota = models.FloatField(
        null=True,
        blank=True
    )
    data_criacao = models.DateTimeField(
        default=timezone.now
    )
    data_atualizacao = models.DateTimeField(
        auto_now=True
    )
    def save(self, *args, **kwargs):
        if not self.pk:
            maior_numero = Tarefa.objects.filter(projeto=self.projeto).aggregate(
                max_num=Max('numero_tarefa_projeto')
            )['max_num']
            self.numero_tarefa_projeto = (maior_numero or 0) + 1
        super().save(*args, **kwargs)
    class Meta:
        verbose_name = "Tarefa"
        verbose_name_plural = "Tarefas"
        ordering = ['coluna__ordem', '-data_criacao', 'titulo']

    def __str__(self):
        projeto_nome = self.projeto.nome if hasattr(self.projeto, 'nome') else str(self.projeto_id)
        return f"{self.titulo} (Projeto: {projeto_nome})"

class Comentario(models.Model):
    conteudo = models.TextField()
    data_criacao = models.DateTimeField(
        default=timezone.now
    )
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, related_name='comentarios_feitos'
    )
    tarefa = models.ForeignKey(
        Tarefa,
        on_delete=models.CASCADE,
        related_name='comentarios'
    )
    visibilidade = models.CharField(
        max_length=20,
        choices=TipoVisibilidadeChoices.choices,
        default=TipoVisibilidadeChoices.PUBLICA
    )

    class Meta:
        verbose_name = "Comentário"
        verbose_name_plural = "Comentários"
        ordering = ['-data_criacao']

    def __str__(self):
        data_formatada = self.data_criacao.strftime('%d/%m/%Y %H:%M') if self.data_criacao else "Data Desconhecida"
        return f"Comentário de {self.autor} em '{self.tarefa.titulo}' ({data_formatada})"