# LearnLoop/learnloop/public/forms.py

from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import UsuarioPersonalizado, PerfilAluno, PerfilProfessor

class CadastroForm(UserCreationForm):
    matricula = forms.CharField(
        label='Matrícula',
        max_length=50,
        required=True,
        help_text='Sua matrícula única (será seu login).'
    )
    nome_completo = forms.CharField(
        label='Nome completo',
        max_length=255,
        required=True
    )
    email = forms.EmailField(
        label='Email',
        required=True
    )

    class Meta:
        model = UsuarioPersonalizado
        fields = ('matricula', 'nome_completo', 'email')

    def clean_matricula(self):
        matricula = self.cleaned_data.get('matricula')
        if matricula:
            # Verifica se a matrícula já existe
            if UsuarioPersonalizado.objects.filter(matricula=matricula).exists():
                raise forms.ValidationError("Essa matrícula já está cadastrada.")

            if not (len(matricula) == 11 or len(matricula) == 6):
                raise forms.ValidationError(
                    "Matrícula inválida. Deve conter 6 caracteres (para professor) ou 11 caracteres (para aluno)."
                )
        else:
            raise forms.ValidationError("Matrícula é obrigatória.")
        return matricula

    def save(self, commit=True):

        user = super().save(commit=False)
        user.username = self.cleaned_data['matricula']

        partes = self.cleaned_data['nome_completo'].strip().split()
        user.first_name = partes[0]
        user.last_name = ' '.join(partes[1:]) if len(partes) > 1 else ''

        matricula_val = self.cleaned_data['matricula']
        if len(matricula_val) == 11:
            user.tipo_usuario = 'aluno'
        elif len(matricula_val) == 6:
            user.tipo_usuario = 'professor'

        if commit:
            user.save()

            if user.tipo_usuario == 'aluno':
                if not hasattr(user, 'perfil_aluno'):
                    PerfilAluno.objects.create(usuario=user)
            elif user.tipo_usuario == 'professor':
                if not hasattr(user, 'perfil_professor'):
                    PerfilProfessor.objects.create(usuario=user)
        return user
    

class LoginForm(forms.Form):
    matricula = forms.CharField(
        label='Matrícula',
        max_length=50,
        required=True,
        widget=forms.TextInput(attrs={'class': 'logform', 'placeholder': 'Matrícula'})
    )
    password = forms.CharField(
        label='Senha',
        required=True,
        widget=forms.PasswordInput(attrs={'class': 'logform', 'placeholder': 'Digite sua senha'})
    )
