// learnloop/public/static/public/scripts/taskDetailModal.js
import { calculateDaysRemaining, formatDateStatus, getDateClass, getCookie } from './utils.js';
import { setupDragAndDrop } from './dragAndDrop.js'; // ADICIONADO
import { openModalForEdit } from './taskModal.js';

// Função auxiliar para sanitizar HTML e determinar a cor do texto
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
 * Cria o HTML para a seção da milestone na barra lateral.
 * @param {object | null} milestone - O objeto da milestone ou null.
 * @returns {string} - O HTML gerado.
 */
function createMilestoneSidebarHTML(milestone) {
    if (!milestone || !milestone.id) {
        return '<span>Nenhum</span>';
    }

    const progress = milestone.total_tasks > 0 ? (milestone.completed_tasks / milestone.total_tasks) * 100 : 0;

    // Usa as funções importadas de utils.js
    const daysRemaining = calculateDaysRemaining(milestone.data_limite);
    const dateText = formatDateStatus(daysRemaining);
    const dateClass = getDateClass(daysRemaining);

    return `
        <div class="milestone-sidebar-info">
            <strong>${sanitizeHTML(milestone.nome)}</strong>
            <div class="milestone-date ${dateClass}">${dateText}</div>
            <div class="milestone-progress">
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progress.toFixed(2)}%;"></div>
                </div>
                <span class="progress-text">${progress.toFixed(0)}%</span>
            </div>
        </div>
    `;
}

/**
 * Cria o HTML para um único card de tarefa.
 * @param {object} taskData - O objeto com os dados da tarefa.
 * @returns {string} - O HTML do card.
 */
function createTaskCardHTML(taskData) {
    const priorityTag = taskData.prioridade
        ? `<span class="meta-tag priority-tag-card" title="${sanitizeHTML(taskData.prioridade.nome)}" style="background-color: ${taskData.prioridade.cor};">${sanitizeHTML(taskData.prioridade.nome)}</span>`
    : '';

    const sizeTag = taskData.tamanho
        ? `<span class="meta-tag size-tag-card" title="${sanitizeHTML(taskData.tamanho.nome)}" style="background-color: ${taskData.tamanho.cor};">${sanitizeHTML(taskData.tamanho.nome)}</span>`
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
            <span class="task-card-project-name">${sanitizeHTML(taskData.projeto_nome)} #${taskData.numero_tarefa_projeto}</span>
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


// --- INÍCIO DA ALTERAÇÃO ---
/**
 * Atualiza todos os cards no quadro com base nos dados mais recentes do servidor.
 * Esta versão gerencia múltiplos painéis (ex: Backlog e Sprint Atual).
 * @param {Array<object>} tasks - Uma lista de objetos de tarefa do backend.
 */
function updateAllTaskCards(tasks) {
    // Adiciona a aba 'Meus Itens' de volta à lista de containers
    const boardContainers = [
        document.querySelector('#content-backlog'),
        document.querySelector('#content-sprint-atual'),
        document.querySelector('#content-meus-itens') // Adicionado
    ];

    // Cria um mapa de tarefas por ID para acesso rápido
    const tasksById = new Map(tasks.map(t => [t.id.toString(), t]));

    boardContainers.forEach(container => {
        if (!container) return; // Pula se o container não existir

        const isSprintBoard = container.id === 'content-sprint-atual';
        const isMyItemsBoard = container.id === 'content-meus-itens'; // Adicionado
        const isBacklogBoard = container.id === 'content-backlog';

        const tasksForThisBoard = new Set(
            tasks.filter(t => {
                const isInCurrentSprint = t.sprint && t.sprint.id === window.CURRENT_SPRINT_ID;
                const isAssignedToCurrentUser = t.responsaveis_ids && t.responsaveis_ids.includes(window.CURRENT_USER_ID);

                if (isSprintBoard) {
                    return isInCurrentSprint;
                }
                if (isMyItemsBoard) {
                    return isAssignedToCurrentUser;
                }
                if (isBacklogBoard) {
                    return true; // Backlog sempre mostra todas as tarefas
                }
                return false;
            }).map(t => t.id.toString())
        );

        const allCardsInContainer = container.querySelectorAll('.task-card');
        const existingCardIdsInContainer = new Set();

        allCardsInContainer.forEach(card => {
            const taskId = card.dataset.taskId;
            existingCardIdsInContainer.add(taskId);

            if (tasksForThisBoard.has(taskId)) {
                // A tarefa pertence a este quadro, então atualiza o card
                const taskData = tasksById.get(taskId);
                card.innerHTML = createTaskCardHTML(taskData);

                // E garante que está na coluna certa
                const targetColumnList = container.querySelector(`.board-column[data-column-id="${taskData.coluna_id}"] .tasks-list`);
                if (targetColumnList && card.parentElement !== targetColumnList) {
                    targetColumnList.appendChild(card);
                }
            } else {
                // A tarefa não pertence mais a este quadro, então remove o card
                card.remove();
            }
        });
        tasksForThisBoard.forEach(taskId => {
            if (!existingCardIdsInContainer.has(taskId)) {
                const taskData = tasksById.get(taskId);
                const targetColumnList = container.querySelector(`.board-column[data-column-id="${taskData.coluna_id}"] .tasks-list`);

                if (targetColumnList) {
                    const newCard = document.createElement('div');
                    newCard.className = 'task-card';
                    newCard.dataset.taskId = taskData.id;
                    newCard.draggable = true;
                    newCard.innerHTML = createTaskCardHTML(taskData);
                    targetColumnList.appendChild(newCard);
                }
            }
        });
    });

    setupDragAndDrop();
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

    const editBtn = document.getElementById('task-detail-edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const taskId = modal.dataset.taskId;
            if (taskId) {
                hideModal(); // Fecha o modal de detalhes
                openModalForEdit(taskId); // Abre o modal de edição
            }
        });
    }

    // Inicia o polling a cada 5 segundos
    setInterval(pollForTaskUpdates, 5000);

    pollForTaskUpdates();

    // Restante da lógica para abrir/fechar o modal de detalhes...
    const closeBtn = document.getElementById('task-detail-close-btn');

    function showModal() {
        modal.style.display = 'flex';
    }

    function hideModal() {
        modal.style.display = 'none';
    }

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
        document.getElementById('task-detail-title').textContent = `${sanitizeHTML(tarefa.titulo)} #${tarefa.numero_tarefa_projeto}`;
        document.getElementById('task-detail-meta').textContent = `Criada em ${new Date(tarefa.data_criacao).toLocaleDateString()}`;
        const descriptionContainer = document.getElementById('task-detail-description');
        descriptionContainer.innerHTML = tarefa.descricao ? marked.parse(tarefa.descricao) : '<p><i>Nenhuma descrição fornecida.</i></p>';
        const assigneesEl = document.querySelector('#sidebar-responsaveis .sidebar-content');
        assigneesEl.innerHTML = !tarefa.responsaveis.length ? '<span>Ninguém</span>' : tarefa.responsaveis.map(user =>
            `<div class="assignee-avatar" title="${sanitizeHTML(user.nome_completo)}"><img src="/static/${user.avatar}" alt="${sanitizeHTML(user.nome_completo)}"></div>`
        ).join('');
        const labelsEl = document.querySelector('#sidebar-tags .sidebar-content');
        labelsEl.innerHTML = !tarefa.tags.length ? '<span>Nenhuma</span>' : tarefa.tags.map(tag => {
            const textColor = isColorLight(tag.cor) ? '#000' : '#FFF';
            return `<span class="meta-tag label-tag-card" style="background-color: ${tag.cor}; color: ${textColor};">${sanitizeHTML(tag.nome)}</span>`;
        }).join('');
        document.querySelector('#sidebar-milestone .sidebar-content').innerHTML = createMilestoneSidebarHTML(tarefa.milestone);
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
        commentsListEl.innerHTML = !data.comentarios.length ? '<p><i>Nenhum comentário.</i></p>' : data.comentarios.map(c => {
            let headerExtra = '';

            if (c.is_autor_professor && c.visibilidade === 'ESPECIFICA' && c.visivel_para__nome_completo) {
                headerExtra = `<span class="comment-visibility-tag" style="font-size: 0.8em; color: #57606a; background-color: #f1f8ff; padding: 2px 6px; border-radius: 5px; border: 1px solid #c8e1ff; margin-left: 10px;">Específico para ${sanitizeHTML(c.visivel_para__nome_completo)}</span>`;
            }
            return `
            <div class="comment-item">
                <img class="avatar" src="/static/${c.autor__avatar}" alt="Avatar">
                <div class="comment-content">
                    <div class="comment-header">
                        <div><strong>${sanitizeHTML(c.autor__nome_completo)}</strong><span class="comment-date"> ${headerExtra}</span></div>
                       ${c.data_criacao}
                    </div>
                    <div class="comment-body"><p>${sanitizeHTML(c.conteudo)}</p></div>
                </div>
            </div>
            `;
        }).join('');
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
        const commentForm = document.getElementById('comment-form');
        if (commentForm) {
            const commentTextarea = document.getElementById('comment-textarea');
            if (commentTextarea) {
                commentTextarea.value = '';
            }

            const publicRadio = commentForm.querySelector('input[name="visibility"][value="PUBLICA"]');
            if (publicRadio) {
                publicRadio.checked = true;
            }

            const userSelect = document.getElementById('specific-user-select');
            if (userSelect) {
                userSelect.style.display = 'none';
                userSelect.innerHTML = '';
            }
        }
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
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideModal();
    });


// learnloop/public/static/public/scripts/taskDetailModal.js

// Adicione este bloco dentro da função setupTaskDetailModal()

    const commentForm = document.getElementById('comment-form');
if (commentForm) {
    const visibilityRadios = commentForm.querySelectorAll('input[name="visibility"]');
    const userSelect = document.getElementById('specific-user-select');
    const submitBtn = document.getElementById('submit-comment-btn');
    const commentTextarea = document.getElementById('comment-textarea');

    // Lógica simplificada para mostrar/esconder e popular o dropdown
    if (visibilityRadios.length > 0 && userSelect) {
        visibilityRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                // Verifica se o radio clicado é o de 'ESPECIFICA'
                if (radio.checked && radio.value === 'ESPECIFICA') {
                    userSelect.style.display = 'inline-block';
                    // Chama a função para popular a lista de alunos
                    populateUserSelect();
                } else {
                    // Esconde o dropdown para as outras opções
                    userSelect.style.display = 'none';
                }
            });
        });
    }

    // Função para buscar e exibir os membros do projeto no dropdown
    async function populateUserSelect() {
        const projectId = modal.dataset.projectId;
        if (!projectId || !userSelect) return;

        userSelect.innerHTML = '<option value="">Carregando...</option>';

        try {
            const response = await fetch(`/projeto/${projectId}/participantes/`);
            if (!response.ok) {
                throw new Error(`Erro na rede: ${response.statusText}`);
            }
            const data = await response.json();

            if (data.status === 'success') {
                userSelect.innerHTML = '<option value="">Selecione um membro...</option>';
                let memberCount = 0;

                if (data.responsavel) {
                    userSelect.innerHTML += `<option value="${data.responsavel.id}">${data.responsavel.nome_completo} (Professor)</option>`;
                    memberCount++;
                }
                if (data.participantes) {
                    data.participantes.forEach(p => {
                        userSelect.innerHTML += `<option value="${p.id}">${p.nome_completo}</option>`;
                        memberCount++;
                    });
                }

                if (memberCount === 0) {
                     userSelect.innerHTML = '<option value="">Nenhum membro no projeto</option>';
                }
            } else {
                throw new Error(data.message || 'Falha ao carregar a lista de membros.');
            }
        } catch(error) {
            console.error("Erro ao popular usuários para comentário:", error);
            userSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        }
    }
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const taskId = modal.dataset.taskId;
            const conteudo = commentTextarea.value.trim();
            if (!conteudo) return;

            const payload = { conteudo };
            const visibilityRadio = commentForm.querySelector('input[name="visibility"]:checked');
            if (visibilityRadio) {
                payload.visibilidade = visibilityRadio.value;
                if (payload.visibilidade === 'ESPECIFICA') {
                    if (!userSelect.value || userSelect.value === "Erro ao carregar") {
                        alert('Selecione um usuário válido para o comentário específico.');
                        return;
                    }
                    payload.visivel_para_id = userSelect.value;
                }
            }

            submitBtn.disabled = true;
            try {
                const response = await fetch(`/tarefa/${taskId}/comentar-ajax/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (result.status === 'success') {
                    commentTextarea.value = '';
                    if(userSelect) {
                        userSelect.style.display = 'none';
                        userSelect.value = '';
                    }
                    // Reseta a visibilidade para "Público" após o envio
                    const publicRadio = commentForm.querySelector('input[name="visibility"][value="PUBLICA"]');
                    if (publicRadio) publicRadio.checked = true;

                    addCommentToDOM(result.comentario);
                } else {
                    alert(`Erro: ${result.message}`);
                }
            } catch (error) {
                alert('Erro de comunicação ao enviar comentário.');
            } finally {
                submitBtn.disabled = false;
            }
        });
    }
        function addCommentToDOM(comment) {
            const commentsListEl = document.getElementById('task-detail-comments-list');

            const noCommentsMsg = commentsListEl.querySelector('p');
            if (noCommentsMsg && noCommentsMsg.textContent.includes('Nenhum comentário')) {
                noCommentsMsg.remove();
            }

            const commentItem = document.createElement('div');
            commentItem.className = 'comment-item';

            let headerExtra = '';
            if (comment.is_autor_professor && comment.visibilidade === 'ESPECIFICA' && comment.visivel_para__nome_completo) {
                headerExtra = `<span class="comment-visibility-tag" style="font-size: 0.8em; color: #57606a; background-color: #f1f8ff; padding: 2px 6px; border-radius: 5px; border: 1px solid #c8e1ff; margin-left: 10px;">Específico para ${sanitizeHTML(comment.visivel_para__nome_completo)}</span>`;
            }

            commentItem.innerHTML = `
                <img class="avatar" src="/static/${comment.autor__avatar}" alt="Avatar">
                <div class="comment-content">
                    <div class="comment-header">
                        <div><strong>${sanitizeHTML(comment.autor__nome_completo)}</strong><span class="comment-date">${headerExtra}</span></div>
                        ${comment.data_criacao}
                    </div>
                    <div class="comment-body"><p>${sanitizeHTML(comment.conteudo)}</p></div>
                </div>
            `;

            commentsListEl.appendChild(commentItem);
            commentsListEl.scrollTop = commentsListEl.scrollHeight;
        }
}