// learnloop/public/static/public/scripts/dragAndDrop.js

import { getCookie } from './utils.js';

// Armazena as referências das funções de evento para que possam ser removidas
const listeners = new Map();

function dragStartHandler() {
    this.classList.add('is-dragging');
}

function dragEndHandler() {
    this.classList.remove('is-dragging');
}

function dragOverHandler(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function dragLeaveHandler() {
    this.classList.remove('drag-over');
}

async function dropHandler(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const draggingTask = document.querySelector('.is-dragging');
    if (!draggingTask) return;

    const tasksList = this.querySelector('.tasks-list');
    if(tasksList) {
        tasksList.appendChild(draggingTask);
    }

    const tarefaId = draggingTask.dataset.taskId;
    const novaColunaId = this.dataset.columnId;

    await updateTaskColumn(tarefaId, novaColunaId);
}


export function setupDragAndDrop() {
    const taskCards = document.querySelectorAll('.task-card');
    const columns = document.querySelectorAll('.board-column');

    if (taskCards.length === 0 || columns.length === 0) {
        return;
    }

    taskCards.forEach(task => {
        // Remove listeners antigos antes de adicionar novos para evitar duplicatas
        if (listeners.has(task)) {
            const oldListeners = listeners.get(task);
            task.removeEventListener('dragstart', oldListeners.dragStart);
            task.removeEventListener('dragend', oldListeners.dragEnd);
        }

        // Adiciona os novos listeners e guarda a referência
        const newListeners = {
            dragStart: dragStartHandler.bind(task),
            dragEnd: dragEndHandler.bind(task)
        };
        task.addEventListener('dragstart', newListeners.dragStart);
        task.addEventListener('dragend', newListeners.dragEnd);
        listeners.set(task, newListeners);
    });

    columns.forEach(column => {
        // A mesma lógica de remoção para as colunas
        if (listeners.has(column)) {
            const oldListeners = listeners.get(column);
            column.removeEventListener('dragover', oldListeners.dragOver);
            column.removeEventListener('dragleave', oldListeners.dragLeave);
            column.removeEventListener('drop', oldListeners.drop);
        }

        const newListeners = {
            dragOver: dragOverHandler.bind(column),
            dragLeave: dragLeaveHandler.bind(column),
            drop: dropHandler.bind(column)
        };
        column.addEventListener('dragover', newListeners.dragOver);
        column.addEventListener('dragleave', newListeners.dragLeave);
        column.addEventListener('drop', newListeners.drop);
        listeners.set(column, newListeners);
    });
}

// A função de atualização permanece a mesma
async function updateTaskColumn(tarefaId, novaColunaId) {
    if (typeof window.moveTaskAjaxUrl === 'undefined') {
        console.error('URL para mover tarefa não definida.');
        return;
    }

    try {
        const response = await fetch(window.moveTaskAjaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({
                tarefa_id: tarefaId,
                nova_coluna_id: novaColunaId,
            }),
        });

        const data = await response.json();

        if (data.status !== 'success') {
            console.error('Erro ao mover tarefa:', data.message);
            alert(`Erro ao salvar a alteração: ${data.message}`);
            window.location.reload();
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('Erro de comunicação com o servidor.');
        window.location.reload();
    }
}