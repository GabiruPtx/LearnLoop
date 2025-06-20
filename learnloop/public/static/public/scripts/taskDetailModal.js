// learnloop/public/static/public/scripts/taskDetailModal.js

// Funções auxiliares para sanitizar HTML e determinar a cor do texto
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

function isColorLight(hex) {
    if (!hex || !hex.startsWith('#')) return true;
    try {
        const [r, g, b] = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
        return (r * 299 + g * 587 + b * 114) / 1000 > 150;
    } catch { return true; }
}

/**
 * Cria o HTML para um único card de tarefa.
 * @param {object} taskData - O objeto com os dados da tarefa.
 * @returns {string} - O HTML do card.
 */
function createTaskCardHTML(taskData) {
    const priorityTag = taskData.prioridade
        ? `<span class="meta-tag priority-tag-card" style="background-color: ${taskData.prioridade.cor};">${taskData.prioridade.nome}</span>`
        : '';

    const sizeTag = taskData.tamanho
        ? `<span class="meta-tag size-tag-card" style="background-color: ${taskData.tamanho.cor};">${taskData.tamanho.nome}</span>`
        : '';

    const sprintTag = taskData.sprint
        ? `<span class="meta-tag sprint-tag-card">
             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
             ${sanitizeHTML(taskData.sprint.nome)}
           </span>`
        : '';

    const labelTags = taskData.tags.map(tag =>
        `<span class="meta-tag label-tag-card" style="background-color: ${tag.cor}; color: ${isColorLight(tag.cor) ? '#000' : '#FFF'};">
            ${sanitizeHTML(tag.nome)}
         </span>`
    ).join('');

    return `
        <div class="task-card-header">
            <span class="task-card-project-icon">✓</span>
            <span class="task-card-project-name">#${taskData.id}</span>
        </div>
        <div class="task-card-title">${sanitizeHTML(taskData.titulo)}</div>
        <div class="task-card-meta">
            ${priorityTag}
            ${sizeTag}
            ${sprintTag}
            ${labelTags}
        </div>
    `;
}

/**
 * Atualiza todos os cards no quadro com base nos dados mais recentes do servidor.
 * @param {Array<object>} tasks - Uma lista de objetos de tarefa do backend.
 */
function updateAllTaskCards(tasks) {
    const board = document.querySelector('.columns-container');
    if (!board) return;

    const taskIdsOnBoard = new Set(tasks.map(t => t.id.toString()));
    const allCardsOnPage = board.querySelectorAll('.task-card');

    // 1. Remover cards que não existem mais
    allCardsOnPage.forEach(card => {
        if (!taskIdsOnBoard.has(card.dataset.taskId)) {
            card.remove();
        }
    });

    // 2. Atualizar ou Adicionar cards
    tasks.forEach(taskData => {
        let card = board.querySelector(`.task-card[data-task-id="${taskData.id}"]`);

        // Se o card não existe, cria um novo
        if (!card) {
            card = document.createElement('div');
            card.className = 'task-card';
            card.dataset.taskId = taskData.id;
            card.draggable = true;
        }

        // Atualiza o conteúdo do card
        card.innerHTML = createTaskCardHTML(taskData);

        // Verifica se o card está na coluna correta, se não, move ele
        const targetColumn = board.querySelector(`.board-column[data-column-id="${taskData.coluna_id}"] .tasks-list`);
        if (targetColumn && card.parentElement !== targetColumn) {
            targetColumn.appendChild(card);
        }
    });
}


/**
 * Inicia o polling para buscar atualizações do quadro periodicamente.
 */
async function pollForTaskUpdates() {
    if (!window.GET_BOARD_STATE_URL) {
        // Para a execução se a URL não estiver definida (ex: em páginas sem projeto selecionado)
        return;
    }

    try {
        const response = await fetch(window.GET_BOARD_STATE_URL);
        if (!response.ok) return; // Ignora falhas de rede silenciosamente

        const data = await response.json();
        if (data.status === 'success') {
            updateAllTaskCards(data.tasks);
        }
    } catch (error) {
        console.warn("Polling para atualização de tarefas falhou. Tentando novamente mais tarde.", error);
    }
}


export function setupTaskDetailModal() {
    const mainContainer = document.querySelector('.main-container');
    const modal = document.getElementById('taskDetailModal');
    if (!mainContainer || !modal) return;

    // Inicia o polling a cada 5 segundos
    setInterval(pollForTaskUpdates, 5000 );

    pollForTaskUpdates();

    // Restante da lógica para abrir/fechar o modal de detalhes...
    const closeBtn = document.getElementById('task-detail-close-btn');

    function showModal() { modal.style.display = 'flex'; }
    function hideModal() { modal.style.display = 'none'; }

    function populateModal(data) {
        const tarefa = data.tarefa;
        modal.dataset.taskId = tarefa.id;
        modal.dataset.projectId = tarefa.projeto_id;
        modal.dataset.currentSelection = JSON.stringify({
            responsaveis: tarefa.responsaveis_ids || [],
            tags: tarefa.tags_ids || [],
            milestone: tarefa.milestone ? [tarefa.milestone.id] : [],
            sprint: tarefa.sprint ? [tarefa.sprint.id] : [],
            prioridade: tarefa.prioridade && tarefa.prioridade.id ? [tarefa.prioridade.id] : [],
            tamanho: tarefa.tamanho && tarefa.tamanho.id ? [tarefa.tamanho.id] : []
        });
        document.getElementById('task-detail-title').textContent = `${sanitizeHTML(tarefa.titulo)} #${tarefa.id}`;
        document.getElementById('task-detail-meta').textContent = `Criada em ${new Date(tarefa.data_criacao).toLocaleDateString()}`;
        const descriptionContainer = document.getElementById('task-detail-description');
        descriptionContainer.innerHTML = tarefa.descricao ? marked.parse(tarefa.descricao) : '<p><i>Nenhuma descrição fornecida.</i></p>';
        const assigneesEl = document.querySelector('#sidebar-responsaveis .sidebar-content');
        assigneesEl.innerHTML = !tarefa.responsaveis.length ? '<span>Ninguém</span>' : tarefa.responsaveis.map(user =>
            `<div class="assignee-avatar" title="${sanitizeHTML(user.nome_completo)}"><img src="https://i.pravatar.cc/30?u=${user.matricula}" alt="${sanitizeHTML(user.nome_completo)}"></div>`
        ).join('');
        const labelsEl = document.querySelector('#sidebar-tags .sidebar-content');
        labelsEl.innerHTML = !tarefa.tags.length ? '<span>Nenhuma</span>' : tarefa.tags.map(tag => {
            const textColor = isColorLight(tag.cor) ? '#000' : '#FFF';
            return `<span class="meta-tag label-tag-card" style="background-color: ${tag.cor}; color: ${textColor};">${sanitizeHTML(tag.nome)}</span>`;
        }).join('');
        document.querySelector('#sidebar-milestone .sidebar-content').innerHTML = `<strong>${tarefa.milestone ? sanitizeHTML(tarefa.milestone.nome) : 'Nenhum'}</strong>`;
        document.querySelector('#sidebar-sprint .sidebar-content').innerHTML = `<strong>${tarefa.sprint ? sanitizeHTML(tarefa.sprint.nome) : 'Nenhum'}</strong>`;
        const priorityEl = document.querySelector('#sidebar-prioridade .sidebar-content');
        if (tarefa.prioridade) {
            const textColor = isColorLight(tarefa.prioridade.cor) ? '#000' : '#FFF';
            priorityEl.innerHTML = `<span class="meta-tag" style="background-color: ${tarefa.prioridade.cor}; color: ${textColor}; border: 1px solid ${tarefa.prioridade.cor};">${sanitizeHTML(tarefa.prioridade.nome)}</span>`;
        } else {
            priorityEl.innerHTML = `<span>Nenhuma</span>`;
        }
        const sizeEl = document.querySelector('#sidebar-tamanho .sidebar-content');
        if (tarefa.tamanho) {
            const textColor = isColorLight(tarefa.tamanho.cor) ? '#000' : '#FFF';
            sizeEl.innerHTML = `<span class="meta-tag" style="background-color: ${tarefa.tamanho.cor}; color: ${textColor}; border: 1px solid ${tarefa.tamanho.cor};">${sanitizeHTML(tarefa.tamanho.nome)}</span>`;
        } else {
            sizeEl.innerHTML = `<span>Nenhum</span>`;
        }
        const commentsListEl = document.getElementById('task-detail-comments-list');
        commentsListEl.innerHTML = !data.comentarios.length ? '<p><i>Nenhum comentário.</i></p>' : data.comentarios.map(c => `
            <div class="comment-item">
                <img class="avatar" src="https://i.pravatar.cc/40?u=${c.autor__matricula}" alt="Avatar">
                <div class="comment-content">
                    <div class="comment-header"><strong>${sanitizeHTML(c.autor__nome_completo)}</strong><span class="comment-date">${c.data_criacao}</span></div>
                    <div class="comment-body"><p>${sanitizeHTML(c.conteudo)}</p></div>
                </div>
            </div>
        `).join('');
    }

    function resetModal() {
        document.getElementById('task-detail-title').textContent = 'Carregando...';
        document.getElementById('task-detail-description').innerHTML = '';
        document.querySelector('#sidebar-responsaveis .sidebar-content').innerHTML = '';
        document.querySelector('#sidebar-tags .sidebar-content').innerHTML = '';
        document.querySelector('#sidebar-milestone .sidebar-content').innerHTML = '<strong></strong>';
        document.querySelector('#sidebar-sprint .sidebar-content').innerHTML = '<strong></strong>';
        document.querySelector('#sidebar-prioridade .sidebar-content').innerHTML = '<span>Nenhuma</span>';
        document.querySelector('#sidebar-tamanho .sidebar-content').innerHTML = '<span>Nenhuma</span>';
        document.getElementById('task-detail-comments-list').innerHTML = '';
    }

    async function fetchAndShowTaskDetails(taskId) {
        resetModal();
        showModal();
        try {
            const response = await fetch(`/tarefa/${taskId}/detalhes/`);
            if (!response.ok) throw new Error(`Erro de rede: ${response.status}`);
            const data = await response.json();
            if (data.status === 'success') {
                populateModal(data);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            document.getElementById('task-detail-description').innerHTML = `<p style="color: red;">Não foi possível carregar os detalhes da tarefa: ${error.message}</p>`;
        }
    }

    mainContainer.addEventListener('click', (e) => {
        const taskCard = e.target.closest('.task-card');
        if (taskCard) {
            e.preventDefault();
            const taskId = taskCard.dataset.taskId;
            if (taskId) fetchAndShowTaskDetails(taskId);
        }
    });

    closeBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });
}