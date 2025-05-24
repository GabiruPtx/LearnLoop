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
        self._responsavel = responsavel  # Deve ser um Professor
        self._tarefas = []  # List[Tarefa]
        self._milestones = []  # List[Milestone]
        self._participantes = []  # List[Usuario] (Alunos principalmente)

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