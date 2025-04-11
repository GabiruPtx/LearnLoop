---
name: "[História de Usuário] Nome resumido da funcionalidade"
about: Template para definição de histórias de usuário
title: "[História de Usuário]"
labels: História de Usuário
assignees: ''

---

## _📖 Como um(a) [tipo de usuário] quero [ação ou funcionalidade] para [benefício ou motivo]_

Exemplo:
Como um(a) aluno(a) quero criar tarefas dentro de um projeto para organizar minhas entregas de trabalho acadêmico.

## **🎯 Objetivo**

_Descrever brevemente o que essa história se propõe a resolver. Seja direto e prático._

## **✅ Critérios de Aceitação**
Esses são os requisitos mínimos que precisam estar presentes para que a história seja considerada "pronta":

- _Deve permitir ao usuário criar uma tarefa com nome, descrição e prazo_
- _A tarefa deve estar vinculada a um projeto existente_
- _Após criada, deve aparecer na tela de tarefas_
- _A tarefa deve ser editável_

## **🔍 Cenários de Teste**
Descreva exemplos práticos de como a funcionalidade pode ser testada ou validada:
Exemplo:

_Dado que estou logado e em um projeto  
Quando clico em "Criar tarefa" e preencho os campos obrigatórios  
Então a nova tarefa deve aparecer na lista de tarefas daquele projeto_

## **🛠️ Notas Técnicas** 
Se necessário, use esse espaço para observações técnicas:
Exemplo:

- _Campos obrigatórios: nome, projeto_
- _Usar form Django ModelForm com validação client-side_

## **🔗 Relacionamentos**
Você pode usar o sistema de Linked Issues do GitHub para conectar este épico com outras issues que ele depende ou está bloqueando. E também usar textos caso queira deixar mais claro.
Exemplo:

- **_Parte do épico:_** #11
- **_Bloqueia/Bloqueado por_** #16 Integração com notificações
