import { getCookie } from './utils.js';

export function setupDragAndDrop() {
    const taskCards = document.querySelectorAll('.task-card');
    const columns = document.querySelectorAll('.board-column');

    if (taskCards.length === 0 || columns.length === 0) {
        return;
    }

    // Adiciona eventos para cada cartão de tarefa
    taskCards.forEach(task => {
        task.addEventListener('dragstart', () => {
            task.classList.add('is-dragging');
        });

        task.addEventListener('dragend', () => {
            task.classList.remove('is-dragging');
        });
    });

    // Adiciona eventos para cada coluna
    columns.forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault(); // Necessário para permitir o 'drop'
            column.classList.add('drag-over');
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });

        column.addEventListener('drop', e => {
            e.preventDefault();
            column.classList.remove('drag-over');

            const draggingTask = document.querySelector('.is-dragging');
            if (!draggingTask) return;

            // Move o elemento no DOM para feedback imediato
            const tasksList = column.querySelector('.tasks-list');
            if(tasksList) {
                tasksList.appendChild(draggingTask);
            }

            const tarefaId = draggingTask.dataset.taskId;
            const novaColunaId = column.dataset.columnId;

            // Envia a atualização para o backend
            updateTaskColumn(tarefaId, novaColunaId);
        });
    });
}

// Função para enviar a requisição AJAX para o backend
async function updateTaskColumn(tarefaId, novaColunaId) {
    // A URL será passada pelo template
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
            // Opcional: Reverter a mudança no DOM se a atualização falhar
            alert(`Erro ao salvar a alteração: ${data.message}`);
            window.location.reload(); // Recarrega a página para garantir consistência
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('Erro de comunicação com o servidor.');
        window.location.reload();
    }
}