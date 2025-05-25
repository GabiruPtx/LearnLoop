"""
Neste arquivo serão configuradas classes de sistema

"""
from typing import List, Optional
from datetime import datetime
from .userclasses import Usuario, Professor, Aluno


class Projeto:
    def __init__(self, id: int, nome: str, descricao: str, data_criacao: datetime, responsavel: Professor):
        self._id = id
        self._nome = nome
        self._descricao = descricao
        self._data_criacao = data_criacao
        self._responsavel = responsavel
        self._tarefas = []
        self._milestones = []
        self._participantes = []

    # Getters
    def get_id(self) -> int:
        return self._id

    def get_nome(self) -> str:
        return self._nome

    def get_descricao(self) -> str:
        return self._descricao

    def get_data_criacao(self) -> datetime:
        return self._data_criacao

    def get_responsavel(self) -> Professor:
        return self._responsavel

    def get_tarefas(self) -> List:
        return self._tarefas

    def get_milestones(self) -> List:
        return self._milestones

    def get_participantes(self) -> List[Usuario]:
        return self._participantes

    # Setters with type checking
    def set_id(self, id: int):
        if not isinstance(id, int):
            raise TypeError("ID must be an integer.")
        self._id = id

    def set_nome(self, nome: str):
        if not isinstance(nome, str):
            raise TypeError("Nome must be a string.")
        self._nome = nome

    def set_descricao(self, descricao: str):
        if not isinstance(descricao, str):
            raise TypeError("Descrição must be a string.")
        self._descricao = descricao

    def set_data_criacao(self, data_criacao: datetime):
        if not isinstance(data_criacao, datetime):
            raise TypeError("Data de criação must be a datetime object.")
        self._data_criacao = data_criacao

    def set_responsavel(self, responsavel: Professor):
        if not isinstance(responsavel, Professor):
            raise TypeError("Responsável must be a Professor instance.")
        self._responsavel = responsavel

    def set_tarefas(self, tarefas: List):
        if not isinstance(tarefas, list):
            raise TypeError("Tarefas must be a list.")
        self._tarefas = tarefas

    def set_milestones(self, milestones: List):
        if not isinstance(milestones, list):
            raise TypeError("Milestones must be a list.")
        self._milestones = milestones

    def set_participantes(self, participantes: List[Usuario]):
        if not isinstance(participantes, list):
            raise TypeError("Participantes must be a list.")
        # Verifica se todos os itens são instâncias de Usuario
        for participante in participantes:
            if not isinstance(participante, Usuario):
                raise TypeError("All participants must be Usuario instances.")
        self._participantes = participantes

    # Função principal especificada no diagrama
    def calcular_nota(self) -> float:
        """
        Calcula a nota geral do projeto baseada nas tarefas concluídas
        e suas avaliações.
        """
        if not self._tarefas:
            return 0.0

        total_pontos = 0.0
        total_peso = 0

        for tarefa in self._tarefas:
            # Verifica se a tarefa tem nota e está concluída
            if hasattr(tarefa, 'get_nota') and hasattr(tarefa, 'get_status'):
                if tarefa.get_status() == 'CONCLUIDA' and tarefa.get_nota() is not None:
                    nota_tarefa = tarefa.get_nota()
                    peso_tarefa = 1  # Peso padrão, pode ser customizado

                    total_pontos += nota_tarefa * peso_tarefa
                    total_peso += peso_tarefa

        if total_peso == 0:
            return 0.0

        nota_final = total_pontos / total_peso
        return round(nota_final, 2)

    # Métodos auxiliares para gerenciamento
    def adicionar_tarefa(self, tarefa) -> bool:
        """Adiciona uma tarefa ao projeto."""
        try:
            if tarefa not in self._tarefas:
                self._tarefas.append(tarefa)
                return True
            return False
        except Exception:
            return False

    def remover_tarefa(self, tarefa) -> bool:
        """Remove uma tarefa do projeto."""
        try:
            if tarefa in self._tarefas:
                self._tarefas.remove(tarefa)
                return True
            return False
        except Exception:
            return False

    def adicionar_milestone(self, milestone) -> bool:
        """Adiciona um milestone ao projeto."""
        try:
            if milestone not in self._milestones:
                self._milestones.append(milestone)
                return True
            return False
        except Exception:
            return False

    def remover_milestone(self, milestone) -> bool:
        """Remove um milestone do projeto."""
        try:
            if milestone in self._milestones:
                self._milestones.remove(milestone)
                return True
            return False
        except Exception:
            return False

    def adicionar_participante(self, participante: Usuario) -> bool:
        """Adiciona um participante ao projeto."""
        try:
            if not isinstance(participante, Usuario):
                raise TypeError("Participante must be a Usuario instance.")
            if participante not in self._participantes:
                self._participantes.append(participante)
                return True
            return False
        except Exception:
            return False

    def remover_participante(self, participante: Usuario) -> bool:
        """Remove um participante do projeto."""
        try:
            if participante in self._participantes:
                self._participantes.remove(participante)
                return True
            return False
        except Exception:
            return False

    def get_progresso_geral(self) -> float:
        """
        Calcula o progresso geral do projeto baseado no status das tarefas.
        Retorna uma porcentagem de 0 a 100.
        """
        if not self._tarefas:
            return 0.0

        tarefas_concluidas = 0
        for tarefa in self._tarefas:
            if hasattr(tarefa, 'get_status') and tarefa.get_status() == 'CONCLUIDA':
                tarefas_concluidas += 1

        progresso = (tarefas_concluidas / len(self._tarefas)) * 100
        return round(progresso, 1)

    def get_total_participantes(self) -> int:
        """Retorna o número total de participantes do projeto."""
        return len(self._participantes)

    def get_tarefas_por_status(self, status: str) -> List:
        """Retorna as tarefas filtradas por status."""
        tarefas_filtradas = []
        for tarefa in self._tarefas:
            if hasattr(tarefa, 'get_status') and tarefa.get_status() == status:
                tarefas_filtradas.append(tarefa)
        return tarefas_filtradas

    def is_responsavel(self, usuario: Usuario) -> bool:
        """Verifica se o usuário é o responsável pelo projeto."""
        return self._responsavel == usuario

    def is_participante(self, usuario: Usuario) -> bool:
        """Verifica se o usuário é participante do projeto."""
        return usuario in self._participantes

    def get_info_basica(self) -> dict:
        """Retorna informações básicas do projeto."""
        return {
            'id': self._id,
            'nome': self._nome,
            'descricao': self._descricao,
            'data_criacao': self._data_criacao,
            'responsavel': self._responsavel.get_nome() if hasattr(self._responsavel, 'get_nome') else str(self._responsavel),
            'total_tarefas': len(self._tarefas),
            'total_participantes': len(self._participantes),
            'progresso': self.get_progresso_geral(),
            'nota': self.calcular_nota()
        }

    def __str__(self) -> str:
        responsavel_nome = self._responsavel.get_nome() if hasattr(self._responsavel, 'get_nome') else str(self._responsavel)
        return f"Projeto: {self._nome} - Responsável: {responsavel_nome}"

    def __repr__(self) -> str:
        return f"Projeto(id={self._id}, nome='{self._nome}', responsavel={self._responsavel})"

from typing import List, Optional
class Tarefa:
        pass
class Milestone: pass
class Sprint: pass
class Comentario: pass
class StatusTarefaConstantes:
    PENDENTE = "PENDENTE"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    CONCLUIDA = "CONCLUIDA"
    CANCELADA = "CANCELADA"

class NivelDificuldadeConstantes:
    FACIL = "FACIL"
    MEDIO = "MEDIO"
    DIFICIL = "DIFICIL"

class NivelPrioridadeConstantes:
    BAIXA = "BAIXA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"
    URGENTE = "URGENTE"

class TamanhoTarefaConstantes:
    PEQUENO = "PEQUENO"
    MEDIO = "MEDIO"
    GRANDE = "GRANDE"

class TipoVisibilidadeConstantes:
    PUBLICA = "PUBLICA"
    ESPECIFICA = "ESPECIFICA"


class Tarefa:
    def __init__(self, id_tarefa: int, titulo: str, descricao: str, projeto_associado: 'Projeto'):
        if not isinstance(id_tarefa, int): raise TypeError("ID da Tarefa deve ser int.")
        if not isinstance(titulo, str): raise TypeError("Título da Tarefa deve ser str.")
        if not isinstance(descricao, str): raise TypeError("Descrição da Tarefa deve ser str.")
        if not isinstance(projeto_associado, Projeto): raise TypeError("Projeto associado deve ser da classe Projeto.")

        self._id_tarefa = id_tarefa
        self._titulo = titulo
        self._descricao = descricao
        self._projeto_associado = projeto_associado  # Referência ao projeto pai
        self._status: str = StatusTarefaConstantes.PENDENTE
        self._responsaveis: List[Aluno] = []
        self._tags: List[str] = []
        self._milestone: Optional[Milestone] = None
        self._relacionamentos: List[Tarefa] = []  # Tarefas relacionadas
        self._especificacoes: str = ""
        self._sprint: Optional[Sprint] = None
        self._comentarios: List[Comentario] = []
        self._visibilidade: str = TipoVisibilidadeConstantes.PUBLICA
        self._nota: Optional[float] = None

    # Getters
    def get_id_tarefa(self) -> int:
        return self._id_tarefa

    def get_titulo(self) -> str:
        return self._titulo

    def get_descricao(self) -> str:
        return self._descricao

    def get_projeto_associado(self) -> 'Projeto':
        return self._projeto_associado

    def get_status(self) -> str:
        return self._status

    def get_responsaveis(self) -> List[Aluno]:
        return self._responsaveis

    def get_tags(self) -> List[str]:
        return self._tags

    def get_milestone(self) -> Optional[Milestone]:
        return self._milestone

    def get_relacionamentos(self) -> List['Tarefa']:
        return self._relacionamentos

    def get_especificacoes(self) -> str:
        return self._especificacoes

    def get_sprint(self) -> Optional[Sprint]:
        return self._sprint

    def get_comentarios(self) -> List[Comentario]:
        return self._comentarios

    def get_visibilidade(self) -> str:
        return self._visibilidade

    def get_nota(self) -> Optional[float]:
        return self._nota

# Setters
    def set_titulo(self, titulo: str):
        if not isinstance(titulo, str): raise TypeError("Título deve ser string.")
        self._titulo = titulo

    def set_descricao(self, descricao: str):
        if not isinstance(descricao, str): raise TypeError("Descrição deve ser string.")
        self._descricao = descricao

    def set_status(self, status: str):
        # Validar contra StatusTarefaConstantes
        if status not in [StatusTarefaConstantes.PENDENTE, StatusTarefaConstantes.EM_ANDAMENTO, StatusTarefaConstantes.CONCLUIDA, StatusTarefaConstantes.CANCELADA]:
            raise ValueError(f"Status inválido: {status}")
        self._status = status

    def set_responsaveis(self, responsaveis: List[Aluno]):
        if not isinstance(responsaveis, list) or not all(isinstance(r, Aluno) for r in responsaveis):
            raise TypeError("Responsáveis deve ser uma lista de Alunos.")
        self._responsaveis = responsaveis

    def adicionar_responsavel(self, responsavel: Aluno):
        if not isinstance(responsavel, Aluno): raise TypeError("Responsável deve ser Aluno.")
        if responsavel not in self._responsaveis:
            self._responsaveis.append(responsavel)

    def remover_responsavel(self, responsavel: Aluno):
        if responsavel in self._responsaveis:
            self._responsaveis.remove(responsavel)

    def set_tags(self, tags: List[str]): # Para substituir todas as tags
        if not isinstance(tags, list) or not all(isinstance(t, str) for t in tags):
            raise TypeError("Tags deve ser uma lista de strings.")
        self._tags = tags

    def adicionar_tag(self, tag: str):
        if not isinstance(tag, str): raise TypeError("Tag deve ser string.")
        if tag not in self._tags:
            self._tags.append(tag)

    def remover_tag(self, tag: str):
        if tag in self._tags:
            self._tags.remove(tag)

    def set_milestone(self, milestone: Optional[Milestone]):
        if milestone is not None and not isinstance(milestone, Milestone):
            raise TypeError("Milestone deve ser da classe Milestone ou None.")
        self._milestone = milestone

    def set_relacionamentos(self, relacionamentos: List['Tarefa']):
        if not isinstance(relacionamentos, list) or not all(isinstance(r, Tarefa) for r in relacionamentos):
            raise TypeError("Relacionamentos deve ser uma lista de Tarefas.")
        self._relacionamentos = relacionamentos # Geralmente 'self' não estaria aqui

    def adicionar_relacionamento(self, tarefa_relacionada: 'Tarefa'):
        if not isinstance(tarefa_relacionada, Tarefa): raise TypeError("Tarefa relacionada deve ser Tarefa.")
        if tarefa_relacionada not in self._relacionamentos and tarefa_relacionada != self:
            self._relacionamentos.append(tarefa_relacionada)

    def set_especificacoes(self, especificacoes: str):
        if not isinstance(especificacoes, str): raise TypeError("Especificações devem ser string.")
        self._especificacoes = especificacoes

    def set_sprint(self, sprint: Optional[Sprint]):
        if sprint is not None and not isinstance(sprint, Sprint):
            raise TypeError("Sprint deve ser da classe Sprint ou None.")
        self._sprint = sprint

    def adicionar_comentario(self, comentario: Comentario):
        if not isinstance(comentario, Comentario):
            raise TypeError("Comentário deve ser da classe Comentario.")
        self._comentarios.append(comentario)

    def set_visibilidade(self, visibilidade: str):
        if visibilidade not in [TipoVisibilidadeConstantes.PUBLICA, TipoVisibilidadeConstantes.ESPECIFICA]:
            raise ValueError(f"Visibilidade inválida: {visibilidade}")
        self._visibilidade = visibilidade

    def set_nota(self, nota: Optional[float]):
        if nota is not None and not isinstance(nota, (float, int)):
            raise TypeError("Nota deve ser um número ou None.")
        self._nota = float(nota) if nota is not None else None

    def __str__(self) -> str:
        return f"Tarefa: {self._titulo} (ID: {self._id_tarefa}, Status: {self._status})"

    def __repr__(self) -> str:
        return f"Tarefa(id_tarefa={self._id_tarefa}, titulo='{self._titulo}')"


class Milestone:
    def __init__(self, id_milestone: int, nome: str, descricao: str, data_limite: datetime,
                 projeto_associado: 'Projeto'):
        if not isinstance(id_milestone, int): raise TypeError("ID do Milestone deve ser int.")
        if not isinstance(nome, str): raise TypeError("Nome do Milestone deve ser str.")
        if not isinstance(descricao, str): raise TypeError("Descrição do Milestone deve ser str.")
        if not isinstance(data_limite, datetime): raise TypeError("Data limite do Milestone deve ser datetime.")
        if not isinstance(projeto_associado, Projeto): raise TypeError("Projeto associado deve ser da classe Projeto.")

        self._id_milestone = id_milestone
        self._nome = nome
        self._descricao = descricao
        self._data_limite = data_limite
        self._projeto_associado = projeto_associado
        self._tarefas_associadas: List[Tarefa] = []  # Tarefas que pertencem a este milestone

    # Getters
    def get_id_milestone(self) -> int:
        return self._id_milestone

    def get_nome(self) -> str:
        return self._nome

    def get_descricao(self) -> str:
        return self._descricao

    def get_data_limite(self) -> datetime:
        return self._data_limite

    def get_projeto_associado(self) -> 'Projeto':
        return self._projeto_associado

    def get_tarefas_associadas(self) -> List[Tarefa]:
        return self._tarefas_associadas

    # Setters
    def set_nome(self, nome: str):
        if not isinstance(nome, str): raise TypeError("Nome deve ser string.")
        self._nome = nome

    def set_descricao(self, descricao: str):
        if not isinstance(descricao, str): raise TypeError("Descrição deve ser string.")
        self._descricao = descricao

    def set_data_limite(self, data_limite: datetime):
        if not isinstance(data_limite, datetime): raise TypeError("Data limite deve ser datetime.")
        self._data_limite = data_limite

    def adicionar_tarefa_associada(self, tarefa: Tarefa):
        if not isinstance(tarefa, Tarefa): raise TypeError("Tarefa deve ser da classe Tarefa.")
        if tarefa not in self._tarefas_associadas:
            self._tarefas_associadas.append(tarefa)
            if tarefa.get_milestone() != self:
                tarefa.set_milestone(self)

    def remover_tarefa_associada(self, tarefa: Tarefa):
        if tarefa in self._tarefas_associadas:
            self._tarefas_associadas.remove(tarefa)
            if tarefa.get_milestone() == self:
                tarefa.set_milestone(None)

    def __str__(self) -> str:
        return f"Milestone: {self._nome} (Projeto: {self._projeto_associado.get_nome() if hasattr(self._projeto_associado, 'get_nome') else 'N/A'})"

    def __repr__(self) -> str:
        return f"Milestone(id_milestone={self._id_milestone}, nome='{self._nome}')"


class Sprint:
    def __init__(self, id_sprint: int, nome: str, dificuldade: str, prioridade: str, tamanho: str):
        if not isinstance(id_sprint, int): raise TypeError("ID do Sprint deve ser int.")
        if not isinstance(nome, str): raise TypeError("Nome do Sprint deve ser str.")
        if dificuldade not in [NivelDificuldadeConstantes.FACIL, NivelDificuldadeConstantes.MEDIO,
                               NivelDificuldadeConstantes.DIFICIL]:
            raise ValueError(f"Dificuldade inválida para Sprint: {dificuldade}")
        if prioridade not in [NivelPrioridadeConstantes.BAIXA, NivelPrioridadeConstantes.MEDIA,
                              NivelPrioridadeConstantes.ALTA, NivelPrioridadeConstantes.URGENTE]:
            raise ValueError(f"Prioridade inválida para Sprint: {prioridade}")
        if tamanho not in [TamanhoTarefaConstantes.PEQUENO, TamanhoTarefaConstantes.MEDIO,
                           TamanhoTarefaConstantes.GRANDE]:
            raise ValueError(f"Tamanho inválido para Sprint: {tamanho}")

        self._id_sprint = id_sprint
        self._nome = nome
        self._dificuldade = dificuldade
        self._prioridade = prioridade
        self._tamanho = tamanho
        self._tarefas_no_sprint: List['Tarefa'] = []

    # Getters
    def get_id_sprint(self) -> int:
        return self._id_sprint

    def get_nome(self) -> str:
        return self._nome

    def get_dificuldade(self) -> str:
        return self._dificuldade

    def get_prioridade(self) -> str:
        return self._prioridade

    def get_tamanho(self) -> str:
        return self._tamanho

    def get_tarefas_no_sprint(self) -> List['Tarefa']:
        return self._tarefas_no_sprint

    # Setters
    def set_nome(self, nome: str):
        if not isinstance(nome, str): raise TypeError("Nome deve ser string.")
        self._nome = nome

    def set_dificuldade(self, dificuldade: str):
        if dificuldade not in [NivelDificuldadeConstantes.FACIL, NivelDificuldadeConstantes.MEDIO,
                               NivelDificuldadeConstantes.DIFICIL]:
            raise ValueError(f"Dificuldade inválida: {dificuldade}")
        self._dificuldade = dificuldade

    def set_prioridade(self, prioridade: str):
        if prioridade not in [NivelPrioridadeConstantes.BAIXA, NivelPrioridadeConstantes.MEDIA,
                              NivelPrioridadeConstantes.ALTA, NivelPrioridadeConstantes.URGENTE]:
            raise ValueError(f"Prioridade inválida: {prioridade}")
        self._prioridade = prioridade

    def set_tamanho(self, tamanho: str):
        if tamanho not in [TamanhoTarefaConstantes.PEQUENO, TamanhoTarefaConstantes.MEDIO,
                           TamanhoTarefaConstantes.GRANDE]:
            raise ValueError(f"Tamanho inválido: {tamanho}")
        self._tamanho = tamanho

    def adicionar_tarefa_ao_sprint(self, tarefa: 'Tarefa'):
        if not isinstance(tarefa, Tarefa): raise TypeError("Objeto da tarefa inválido. Deve ser da classe Tarefa.")
        if tarefa not in self._tarefas_no_sprint:
            self._tarefas_no_sprint.append(tarefa)
            if tarefa.get_sprint() != self:
                tarefa.set_sprint(self)

    def remover_tarefa_do_sprint(self, tarefa: 'Tarefa'):
        if not isinstance(tarefa, Tarefa): raise TypeError("Objeto da tarefa inválido. Deve ser da classe Tarefa.")
        try:
            self._tarefas_no_sprint.remove(tarefa)
            if tarefa.get_sprint() == self:
                tarefa.set_sprint(None)
        except ValueError:
            pass

    def __str__(self) -> str:
        return f"Sprint: {self._nome} (ID: {self._id_sprint})"

    def __repr__(self) -> str:
        return f"Sprint(id_sprint={self._id_sprint}, nome='{self._nome}')"


class Comentario:
    def __init__(self, id_comentario: int, conteudo: str, data_criacao: datetime, autor: 'Usuario',
                 tarefa_associada: 'Tarefa'):
        if not isinstance(id_comentario, int): raise TypeError("ID do Comentário deve ser int.")
        if not isinstance(conteudo, str): raise TypeError("Conteúdo do Comentário deve ser str.")
        if not isinstance(data_criacao, datetime): raise TypeError("Data de criação do Comentário deve ser datetime.")

        self._id_comentario = id_comentario
        self._conteudo = conteudo
        self._data_criacao = data_criacao
        self._autor = autor
        self._tarefa_associada = tarefa_associada
        self._visibilidade: str = TipoVisibilidadeConstantes.PUBLICA

    # Getters
    def get_id_comentario(self) -> int:
        return self._id_comentario

    def get_conteudo(self) -> str:
        return self._conteudo

    def get_data_criacao(self) -> datetime:
        return self._data_criacao

    def get_autor(self) -> 'Usuario':
        return self._autor

    def get_tarefa_associada(self) -> 'Tarefa':
        return self._tarefa_associada

    def get_visibilidade(self) -> str:
        return self._visibilidade

    # Setters
    def set_conteudo(self, conteudo: str):
        if not isinstance(conteudo, str): raise TypeError("Conteúdo deve ser string.")
        self._conteudo = conteudo

    def set_visibilidade(self, visibilidade: str):
        if visibilidade not in [TipoVisibilidadeConstantes.PUBLICA, TipoVisibilidadeConstantes.ESPECIFICA]:
            raise ValueError(f"Visibilidade inválida: {visibilidade}")
        self._visibilidade = visibilidade

    def __str__(self) -> str:
        autor_nome = "N/A"
        if hasattr(self._autor, 'get_nome'):
            autor_nome = self._autor.get_nome()
        elif hasattr(self._autor, '_nome'):
            autor_nome = self._autor._nome
        elif self._autor is not None:
            autor_nome = str(self._autor)
        return f"Comentário (ID: {self._id_comentario}) por {autor_nome} em '{self._data_criacao.strftime('%Y-%m-%d %H:%M')}'"

    def __repr__(self) -> str:
        autor_repr = "None"
        if hasattr(self._autor, 'get_nome'):
            autor_repr = self._autor.get_nome()
        elif self._autor is not None:
            autor_repr = str(self._autor)  # Fallback para o __str__ do autor
        return f"Comentario(id_comentario={self._id_comentario}, autor='{autor_repr}')"