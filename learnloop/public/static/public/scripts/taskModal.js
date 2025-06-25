import { getCookie } from './utils.js';
import { getSelectedAssignees, clearSelectedAssignees, setSelectedAssignees } from './assigneeMenu.js';
import { getSelectedMilestone, clearSelectedMilestone, setSelectedMilestone } from './milestoneMenu.js';
import { getSelectedLabels, clearSelectedLabels, setSelectedLabels } from './labelMenu.js';

let easyMDE;

// Função para abrir o modal no modo de CRIAÇÃO
function openModalForCreate(event) {
    const modal = document.getElementById('addTaskModal');
    const form = document.getElementById('addTaskForm');
    const title = document.getElementById('task-modal-title');
    const button = document.getElementById('confirmTaskButton');

    // Limpa o estado anterior
    form.reset();
    form.dataset.taskId = ''; // Garante que não há ID de tarefa
    if(easyMDE) easyMDE.value('');
    clearSelectedAssignees();
    clearSelectedMilestone();
    clearSelectedLabels();

    // Configura para "Criar"
    title.textContent = 'Crie uma nova task';
    button.textContent = 'Criar Task';

    // Pega o ID da coluna do botão que foi clicado
    const columnDiv = event.currentTarget.closest('.board-column');
    if (columnDiv) {
        form.dataset.columnId = columnDiv.dataset.columnId;
    }

    modal.style.display = 'flex';
}

// Função para abrir o modal no modo de EDIÇÃO
export async function openModalForEdit(taskId) {
    const modal = document.getElementById('addTaskModal');
    const form = document.getElementById('addTaskForm');
    const title = document.getElementById('task-modal-title');
    const button = document.getElementById('confirmTaskButton');

    try {
        // Busca os detalhes completos da tarefa
        const response = await fetch(`/tarefa/${taskId}/detalhes/`);
        const data = await response.json();
        if (data.status !== 'success') throw new Error(data.message);

        const tarefa = data.tarefa;

        // Limpa estado anterior e define o ID da tarefa
        form.reset();
        form.dataset.taskId = tarefa.id; // Define o ID da tarefa para o modo de edição
        form.dataset.columnId = tarefa.coluna; // Armazena a coluna atual

        // Configura para "Editar"
        title.textContent = 'Editar Tarefa';
        button.textContent = 'Salvar Alterações';
        document.getElementById('taskTitleInput').value = tarefa.titulo;
        if(easyMDE) easyMDE.value(tarefa.descricao || '');

        // Pré-seleciona os valores nos menus
        setSelectedAssignees(tarefa.responsaveis_ids);
        setSelectedMilestone(tarefa.milestone ? tarefa.milestone.id : null);
        setSelectedLabels(tarefa.tags_ids);

        modal.style.display = 'flex';

    } catch (error) {
        alert(`Erro ao carregar dados da tarefa: ${error.message}`);
    }
}

// Função genérica para fechar o modal
function closeModal() {
    const modal = document.getElementById('addTaskModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Função principal de configuração
export function setupTaskModal() {
    const addTaskModal = document.getElementById('addTaskModal');
    if (!addTaskModal) return;

    const openTaskModalButtons = document.querySelectorAll('.add-task-button');
    const closeButton = document.getElementById('closeAddTaskModal');
    const cancelButton = document.getElementById('cancelAddTaskButton');
    const taskForm = document.getElementById('addTaskForm');

    // Inicializa o editor de markdown
    if (!easyMDE) {
        easyMDE = new EasyMDE({
            element: document.getElementById('taskDescriptionEditor'),
            spellChecker: false,
            placeholder: "Digite a descrição, use @ para mencionar usuários, anexe arquivos...",
            toolbar: ["bold", "italic", "strikethrough", "|", "quote", "code", "link", "|", "unordered-list", "ordered-list", "|", "preview"],
        });
    }

    // Eventos para abrir o modal no modo de CRIAÇÃO
    openTaskModalButtons.forEach(button => {
        button.addEventListener('click', openModalForCreate);
    });

    // Eventos para fechar o modal
    closeButton.addEventListener('click', closeModal);
    cancelButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === addTaskModal) {
            closeModal();
        }
    });

    // Evento de submissão do formulário (lida com CRIAR e EDITAR)
    taskForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const confirmButton = document.getElementById('confirmTaskButton');
        confirmButton.disabled = true;

        const taskId = taskForm.dataset.taskId;
        const isEditing = !!taskId; // Converte para booleano

        const url = isEditing ? `/tarefa/${taskId}/editar-ajax/` : createTaskAjaxUrl;

        const formData = new FormData();
        formData.append('task_title', document.getElementById('taskTitleInput').value);
        formData.append('task_description', easyMDE.value());
        formData.append('project_id', new URLSearchParams(window.location.search).get('projeto_id'));
        formData.append('column_id', taskForm.dataset.columnId);

        // Coleta dados dos menus
        getSelectedAssignees().forEach(id => formData.append('responsaveis[]', id));
        getSelectedLabels().forEach(id => formData.append('tags[]', id));
        const milestoneId = getSelectedMilestone();
        if (milestoneId) {
            formData.append('milestone_id', milestoneId);
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'X-CSRFToken': getCookie('csrftoken') },
                body: formData
            });
            const data = await response.json();

            if (data.status === 'success') {
                closeModal();
                window.location.reload(); // Recarrega para ver as mudanças
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error("Erro no fetch:", error);
            alert(`Erro ao salvar tarefa: ${error.message}`);
        } finally {
            confirmButton.disabled = false;
        }
    });
}