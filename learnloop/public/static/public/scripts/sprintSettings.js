function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

export function setupSprintSettings() {
    const container = document.querySelector('.iteration-settings-container');
    if (!container) return;

    const projectId = window.PROJECT_ID;
    if (!projectId) { return; }
    
    // --- ELEMENTOS DA UI ---
    const tableBody = document.getElementById('sprints-table-body');
    const loadingDiv = document.getElementById('sprints-loading');
    
    // 1. ADICIONADO: Selecionando o container das abas e definindo a visão inicial
    const tabsContainer = container.querySelector('.iteration-tabs');
    let currentView = 'current'; // 'current' ou 'completed'

    const addIterationBtn = document.getElementById('add-iteration-btn');
    const moreOptionsBtn = document.getElementById('more-options-btn');
    const moreOptionsPopover = document.getElementById('more-options-popover');
    const startDatePickerInput = document.getElementById('custom-start-date-picker');
    const customDurationInput = document.getElementById('custom-duration-input');
    const customUnitSelect = document.getElementById('custom-unit-select');
    const confirmCustomAddBtn = document.getElementById('confirm-custom-add-btn');
    const cancelCustomAddBtn = document.getElementById('cancel-custom-add-btn');
    const deleteModal = document.getElementById('deleteSprintModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteSprintBtn');
    const cancelDeleteBtns = deleteModal.querySelectorAll('.cancel-delete-sprint, .close-modal-btn');
    let sprintToDeleteId = null;
    const ajaxUrl = `/projeto/${projectId}/sprints-ajax/`;
    let allSprints = [];

    const datePicker = flatpickr(startDatePickerInput, {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d/m/Y",
        locale: "pt",
        minDate: "today",
    });

    // --- FUNÇÕES ---
    function renderTable() {
        tableBody.innerHTML = '';
        
        // 2. ADICIONADO: Lógica para filtrar as iterações antes de exibir
        const sprintsToShow = allSprints.filter(sprint => {
            if (currentView === 'completed') {
                return sprint.status === 'Completed';
            }
            return sprint.status !== 'Completed';
        });

        if (sprintsToShow.length > 0) {
            // Itera sobre a lista filtrada 'sprintsToShow'
            sprintsToShow.forEach(sprint => {
                const row = document.createElement('tr');
                let statusClass = sprint.status.toLowerCase();
                row.innerHTML = `
                    <td>${sprint.nome}</td>
                    <td>${sprint.data_inicio} - ${sprint.data_fim}</td>
                    <td><span class="sprint-status-tag ${statusClass}">${sprint.status}</span></td>
                    <td class="action-cell">
                        <button class="delete-sprint-btn" data-sprint-id="${sprint.id}" title="Excluir Iteração">
                            <img src="/static/public/images/Trash.svg" alt="Delete">
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">Nenhuma iteração nesta categoria.</td></tr>`;
        }
    }

    async function fetchData() {
        loadingDiv.style.display = 'block';
        tableBody.innerHTML = '';
        try {
            const response = await fetch(ajaxUrl);
            const data = await response.json();
            if (data.status === 'success') {
                allSprints = data.sprints; // Armazena a lista completa
                customDurationInput.placeholder = data.settings.duration;
                customUnitSelect.value = data.settings.unit;
                renderTable(); // Renderiza a tabela com o filtro inicial
            }
        } catch (error) {
            loadingDiv.textContent = "Erro ao carregar dados.";
        } finally {
            if (tableBody.innerHTML) loadingDiv.style.display = 'none';
        }
    }

    async function postData(action, body) {
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
    
    // --- EVENTOS ---
    
    // 3. ADICIONADO: Evento de clique para as abas
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            const clickedTab = e.target.closest('.iteration-tab-btn');
            if (clickedTab && !clickedTab.classList.contains('active')) {
                tabsContainer.querySelector('.active').classList.remove('active');
                clickedTab.classList.add('active');
                currentView = clickedTab.dataset.view;
                renderTable(); // Re-renderiza a tabela com o novo filtro
            }
        });
    }

    // O resto dos seus eventos continua igual
    addIterationBtn.addEventListener('click', async () => {
        addIterationBtn.disabled = true;
        addIterationBtn.textContent = '...';
        const result = await postData('add_iteration', { start_date: "" });
        if (result.status === 'success') {
            fetchData();
        } else {
            alert('Erro: ' + result.message);
        }
        addIterationBtn.disabled = false;
        addIterationBtn.textContent = '+ Add Iteration';
    });

    moreOptionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moreOptionsPopover.style.display = moreOptionsPopover.style.display === 'block' ? 'none' : 'block';
    });
    
    confirmCustomAddBtn.addEventListener('click', async () => {
        const durationValue = customDurationInput.value.trim();
        const startDateValue = datePicker.selectedDates[0] ? datePicker.formatDate(datePicker.selectedDates[0], "Y-m-d") : "";
        if (!startDateValue) {
            alert('Por favor, selecione uma data de início.');
            return;
        }
        const body = {
            start_date: startDateValue,
            unit: customUnitSelect.value,
        };
        if (durationValue) {
            body.duration = durationValue;
        }
        const result = await postData('add_iteration', body);
        if (result.status === 'success') {
            moreOptionsPopover.style.display = 'none';
            datePicker.clear();
            customDurationInput.value = '';
            fetchData();
        } else {
            alert('Erro: ' + result.message);
        }
    });

    tableBody.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-sprint-btn');
        if (deleteBtn) {
            sprintToDeleteId = deleteBtn.dataset.sprintId;
            deleteModal.classList.add('visible');
        }
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (!sprintToDeleteId) return;
        const result = await postData('delete_iteration', { sprint_id: sprintToDeleteId });
        if (result.status === 'success') fetchData();
        else alert('Erro: ' + result.message);
        deleteModal.classList.remove('visible');
        sprintToDeleteId = null;
    });

    cancelCustomAddBtn.addEventListener('click', () => moreOptionsPopover.style.display = 'none');
    document.addEventListener('click', (e) => {
        if (moreOptionsPopover && !moreOptionsPopover.contains(e.target) && e.target !== moreOptionsBtn) {
            moreOptionsPopover.style.display = 'none';
        }
    });
    cancelDeleteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            deleteModal.classList.remove('visible');
        });
    });
    
    fetchData();
}