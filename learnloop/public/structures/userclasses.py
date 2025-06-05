"""
Neste arquivo serão configuradas classes de usuário


ARQUIVO DEPRECIADO VER learnloop/public/models.py

"""

class Usuario:
    def __init__(self, matricula: str, nome: str, email: str, senha: str):
        self._matricula = matricula
        self._nome = nome
        self._email = email
        self._senha = senha

    # Getters
    def get_matricula(self) -> str:
        return self._matricula

    def get_nome(self) -> str:
        return self._nome

    def get_email(self) -> str:
        return self._email

    def get_senha(self) -> str:
        return self._senha

    # Setters with type checking
    def set_matricula(self, matricula: str):
        if not isinstance(matricula, str):
            raise TypeError("Matrícula must be a string.")
        self._matricula = matricula

    def set_nome(self, nome: str):
        if not isinstance(nome, str):
            raise TypeError("Nome must be a string.")
        self._nome = nome

    def set_email(self, email: str):
        if not isinstance(email, str):
            raise TypeError("Email must be a string.")
        self._email = email

    def set_senha(self, senha: str):
        if not isinstance(senha, str):
            raise TypeError("Senha must be a string.")
        self._senha = senha

    # Functions returning pass
    def autenticar(self) -> bool:
        pass

    def verificar_acesso(self) -> bool:
        pass


class Professor(Usuario):
    def __init__(self, matricula: str, nome: str, email: str, senha: str):
        super().__init__(matricula, nome, email, senha)

    # Functions returning pass
    def gerencia_projeto(self, projeto) -> None:
        pass

    def gerencia_alunos(self, aluno) -> None:
        pass

    def avaliar_tarefa(self, tarefa, nota: float) -> None:
        pass

    def adicionar_comentario(self, tarefa, comentario: str) -> None:
        pass

    def definir_visibilidade(self, comentario, visibilidade) -> None: # Removed Enum type hint
        pass

    def adicionar_milestone(self, projeto, milestone) -> None:
        pass


class Aluno(Usuario):
    def __init__(self, matricula: str, nome: str, email: str, senha: str):
        super().__init__(matricula, nome, email, senha)

    # Functions returning pass
    def criar_tarefa(self, projeto, tarefa, responsaveis: list) -> None:
        pass

    def adicionar_tags(self, tarefa, tags: list) -> None:
        pass

    def editar_tarefa(self, tarefa, especificacoes: dict) -> None:
        pass

    def configurar_relacionamentos(self, tarefa, relacionamentos: list) -> None:
        pass

    def editar_especificacoes(self, tarefa, especificacoes: dict) -> None:
        pass

    def configurar_dependencia(self, tarefa, sprint) -> None:
        pass