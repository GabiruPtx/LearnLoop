import {  getCookie } from './utils.js';
export function setupMilestoneSettings() {
    const container = document.querySelector('.milestone-container');
    if (!container) return;

    // --- ELEMENTOS DA UI (sem alterações) ---
    const newMilestoneBtn = document.getElementById('new-milestone-btn');
    const sortBtn = document.getElementById('sort-milestone-btn');
    const milestoneList = document.getElementById('milestone-list');
    const filterTabsContainer = container.querySelector('.milestone-filters');
    const editModal = document.getElementById('milestone-modal');
    const deleteModal = document.getElementById('deleteMilestoneModal');
    const closeModalEl = document.getElementById('closeMilestoneModal');
    const optionsMenu = document.getElementById('milestone-options-menu');
    const sortMenu = document.getElementById('milestone-sort-menu');
    const modalTitle = document.getElementById('milestone-modal-title');
    const saveBtn = document.getElementById('save-milestone-btn');
    const milestoneForm = document.getElementById('milestone-form');
    const confirmDeleteBtn = document.getElementById('confirm-delete-milestone-btn');
    const confirmCloseBtn = document.getElementById('confirm-close-milestone-btn');
    const titleInput = document.getElementById('milestone-title-input');
    const dueDateInput = document.getElementById('milestone-due-date-input');
    const descriptionInput = document.getElementById('milestone-description-input');

    // --- Variáveis de Estado ---
    let currentMilestone = null; // Guarda o objeto milestone que está sendo manipulado
    let allMilestones = []; // Guarda a lista completa de milestones vinda do backend
    let currentView = 'open'; // 'open' ou 'closed'
    const projectId = window.PROJECT_ID;
    const ajaxUrl = `/projeto/${projectId}/milestones-ajax/`;

    const datePicker = flatpickr(dueDateInput, {
        dateFormat: "Y-m-d", altInput: true, altFormat: "F j, Y", locale: "pt"
    });

    // --- FUNÇÕES DE COMUNICAÇÃO COM O BACKEND ---

    // Função para buscar os dados do backend
    async function fetchData(sortBy = 'due_date') {
        milestoneList.innerHTML = `<div style="text-align:center; padding: 20px;">Carregando...</div>`;
        try {
            const response = await fetch(`${ajaxUrl}?sort=${sortBy}`);
            const data = await response.json();
            if (data.status === 'success') {
                allMilestones = data.milestones;
                renderList();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            milestoneList.innerHTML = `<div style="text-align:center; padding: 20px; color: red;">Erro ao carregar milestones.</div>`;
            console.error("Fetch error:", error);
        }
    }

    // Função para enviar dados (Create, Update, Delete, etc.)
    async function postData(action, body = {}) {
        try {
            const response = await fetch(ajaxUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
                body: JSON.stringify({ action, ...body }),
            });
            return await response.json();
        } catch (error) {
            return { status: 'error', message: 'Erro de comunicação.' };
        }
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO E UI ---

    // Função para criar o HTML da lista a partir dos dados do backend
    function renderList() {
        milestoneList.innerHTML = '';

        const milestonesToShow = allMilestones.filter(m => {
            return currentView === 'closed' ? m.status === 'CLOSED' : m.status === 'OPEN';
        });

        if (milestonesToShow.length === 0) {
            milestoneList.innerHTML = `<div style="text-align:center; padding: 20px;">Não há milestones nesta categoria.</div>`;
            return;
        }

        milestonesToShow.forEach(m => {
            const overdueText = m.overdue_days > 0 ? `<span class="milestone-overdue">Overdue by ${m.overdue_days} day(s)</span>` : '';
            const progressBarColor = m.status === 'CLOSED' ? '#5cb85c' : '#0072C6';

            const item = document.createElement('li');
            item.className = `milestone-item ${m.status === 'CLOSED' ? 'closed' : ''}`;
            item.dataset.milestoneId = m.id; // Guarda o ID no elemento

            item.innerHTML = `
                <div class="milestone-main-info">
                    <h3>${m.nome}</h3>
                    <p>${m.descricao || ''}</p>
                    <div class="milestone-meta">
                        ${overdueText}
                        <span>${m.data_limite_formatted}</span>
                    </div>
                </div>
                <div class="milestone-progress-info">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${m.progress}%; background-color: ${progressBarColor};"></div>
                    </div>
                    <div class="milestone-stats">
                        <span><strong>${m.progress}%</strong> complete</span>
                        <span><strong>${m.open_tasks}</strong> open</span>
                        <span><strong>${m.closed_tasks}</strong> closed</span>
                    </div>
                    <div class="milestone-item-actions">
                        <button class="icon-btn milestone-options-btn">...</button>
                    </div>
                </div>
            `;
            // Adiciona o objeto de dados completo ao elemento para fácil acesso
            item.milestoneData = m;
            milestoneList.appendChild(item);
        });
    }

        function openModalForCreate() {
            currentMilestone = null; // Garante que estamos criando, não editando
            modalTitle.textContent = "Create milestone";
            saveBtn.textContent = "Create milestone";
            milestoneForm.reset();
            datePicker.clear();
            editModal.style.display = ""; // <-- ADICIONE ESTA LINHA
            editModal.classList.add('visible');
        }

        function openModalForEdit() {
            if (!currentMilestone) return;
            modalTitle.textContent = "Edit milestone";
            saveBtn.textContent = "Save changes";
            titleInput.value = currentMilestone.nome;
            descriptionInput.value = currentMilestone.descricao;
            datePicker.setDate(currentMilestone.data_limite_raw);
            editModal.style.display = ""; // <-- ADICIONE ESTA LINHA
            editModal.classList.add('visible');
        }

    function closeModal(modalElement) {
        if (modalElement) modalElement.classList.remove('visible');
    }

    filterTabsContainer.addEventListener('click', (e) => {
        const clickedTab = e.target.closest('.milestone-filter-btn');
        if (clickedTab && !clickedTab.classList.contains('active')) {
            filterTabsContainer.querySelector('.active').classList.remove('active');
            clickedTab.classList.add('active');
            currentView = clickedTab.textContent.toLowerCase();
            renderList();
        }
    });

    // Ordenação
    sortMenu.addEventListener('click', (e) => {
        const sortOption = e.target.textContent; // Ex: "Closest due date"
        let sortBy = 'due_date'; // default
        if (sortOption === 'Closest due date') sortBy = 'closest_due';
        if (sortOption === 'Furthest due date') sortBy = 'furthest_due';
        fetchData(sortBy);
        sortMenu.style.display = 'none';
    });

    // Salvar (Criar ou Editar)
    milestoneForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const action = currentMilestone ? 'edit' : 'create';
        const body = {
            id: currentMilestone ? currentMilestone.id : null,
            title: titleInput.value,
            description: descriptionInput.value,
            due_date: dueDateInput.value ? datePicker.formatDate(datePicker.selectedDates[0], "Y-m-d") : null,
        };
        const result = await postData(action, body);
        if (result.status === 'success') {
            closeModal(editModal);
            fetchData();
        } else {
            alert('Erro: ' + (result.message || 'Não foi possível salvar.'));
        }
    });

    // Abrir menu de opções "..."
    milestoneList.addEventListener('click', (e) => {
        const optionsBtn = e.target.closest('.milestone-options-btn');
        if (optionsBtn) {
            e.stopPropagation();
            const itemElement = optionsBtn.closest('.milestone-item');
            currentMilestone = itemElement.milestoneData; // Pega o objeto de dados completo

            optionsMenu.style.display = 'block';
            const rect = optionsBtn.getBoundingClientRect();
            optionsMenu.style.top = `${rect.bottom + window.scrollY}px`;
            optionsMenu.style.left = `${rect.right - optionsMenu.offsetWidth}px`;
        }
    });

        optionsMenu.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (!menuItem) return;

            const targetId = menuItem.id;
            optionsMenu.style.display = 'none';

            if (!currentMilestone) {
                console.error("Ação de menu clicada, mas nenhum milestone estava selecionado.");
                return;
            }

            if (targetId === 'edit-milestone-option') {
                openModalForEdit();
            } else if (targetId === 'delete-milestone-option') {
                deleteModal.style.display = "";
                deleteModal.classList.add('visible');
            } else if (targetId === 'close-milestone-option') {
                closeModalEl.style.display = "";
                closeModalEl.classList.add('visible');
            }
    });

    // Botões de confirmação dos modais
    confirmDeleteBtn.addEventListener('click', async () => {
        const result = await postData('delete', { id: currentMilestone.id });
        if (result.status === 'success') {
            closeModal(deleteModal);
            fetchData();
        } else { alert('Erro: ' + result.message); }
    });

    confirmCloseBtn.addEventListener('click', async () => {
        const result = await postData('close', { id: currentMilestone.id });
        if (result.status === 'success') {
            closeModal(closeModalEl);
            fetchData();
        } else { alert('Erro: ' + result.message); }
    });

    // Outros botões e eventos
    newMilestoneBtn.addEventListener('click', openModalForCreate);
    sortBtn.addEventListener('click', (e) => { e.stopPropagation(); sortMenu.style.display = 'block'; });
    editModal.querySelectorAll('.close-modal-btn, .btn-secondary').forEach(btn => btn.addEventListener('click', () => closeModal(editModal)));
    deleteModal.querySelectorAll('.close-modal-btn, .btn-secondary').forEach(btn => btn.addEventListener('click', () => closeModal(deleteModal)));
    closeModalEl.querySelectorAll('.close-modal-btn, .btn-secondary').forEach(btn => btn.addEventListener('click', () => closeModal(closeModalEl)));
    document.addEventListener('click', () => { sortMenu.style.display = 'none'; optionsMenu.style.display = 'none'; });

    // --- INICIALIZAÇÃO ---
    fetchData();
}