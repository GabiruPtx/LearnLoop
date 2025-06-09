export function setupMilestoneSettings() {
    const container = document.querySelector('.milestone-container');
    if (!container) return;

    // --- ELEMENTOS DA UI ---
    const newMilestoneBtn = document.getElementById('new-milestone-btn');
    const sortBtn = document.getElementById('sort-milestone-btn');
    const milestoneList = document.getElementById('milestone-list');
    const filterTabsContainer = container.querySelector('.milestone-filters');
    
    // Modais e Menus
    const editModal = document.getElementById('milestone-modal');
    const deleteModal = document.getElementById('deleteMilestoneModal');
    // CORREÇÃO: Variável renomeada para evitar conflito com a função closeModal()
    const closeMilestoneModal = document.getElementById('closeMilestoneModal'); 
    
    const optionsMenu = document.getElementById('milestone-options-menu');
    const sortMenu = document.getElementById('milestone-sort-menu');
    
    // Botões dos modais
    const modalTitle = document.getElementById('milestone-modal-title');
    const saveBtn = document.getElementById('save-milestone-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-milestone-btn');
    const confirmCloseBtn = document.getElementById('confirm-close-milestone-btn');

    // Inputs do Formulário
    const titleInput = document.getElementById('milestone-title-input');
    const dueDateInput = document.getElementById('milestone-due-date-input');
    const descriptionInput = document.getElementById('milestone-description-input');
    
    let currentItem = null;
    let currentView = 'open';

    const datePicker = flatpickr(dueDateInput, {
        dateFormat: "Y-m-d", altInput: true, altFormat: "F j, Y", locale: "pt"
    });

    // --- FUNÇÕES ---
    function renderList() {
        const allItems = milestoneList.querySelectorAll('.milestone-item');
        allItems.forEach(item => {
            const isClosed = item.classList.contains('closed');
            if (currentView === 'closed') {
                item.style.display = isClosed ? 'flex' : 'none';
            } else { // 'open'
                item.style.display = isClosed ? 'none' : 'flex';
            }
        });
    }
    
    function openModalForCreate() {
        modalTitle.textContent = "Create milestone";
        saveBtn.textContent = "Create milestone";
        document.getElementById('milestone-form').reset();
        datePicker.clear();
        editModal.classList.add('visible');
    }

    function openModalForEdit(item) {
        modalTitle.textContent = "Edit milestone";
        saveBtn.textContent = "Save changes";
        titleInput.value = item.querySelector('h3').textContent;
        descriptionInput.value = item.querySelector('p').textContent;
        editModal.classList.add('visible');
    }

    // CORREÇÃO: Função para fechar qualquer modal
    function closeModal(modalElement) {
        if(modalElement) modalElement.classList.remove('visible');
    }

    // --- EVENT LISTENERS ---

    // Lógica das abas
    filterTabsContainer.addEventListener('click', (e) => {
        const clickedTab = e.target.closest('.milestone-filter-btn');
        if (clickedTab && !clickedTab.classList.contains('active')) {
            filterTabsContainer.querySelector('.active').classList.remove('active');
            clickedTab.classList.add('active');
            currentView = clickedTab.textContent.toLowerCase();
            renderList();
        }
    });

    // CORRIGIDO: Botão para criar novo milestone
    newMilestoneBtn.addEventListener('click', openModalForCreate);
    
    // CORRIGIDO: Eventos para fechar TODOS os modais
    editModal.querySelectorAll('.close-modal-btn, .btn-secondary').forEach(btn => btn.addEventListener('click', () => closeModal(editModal)));
    deleteModal.querySelectorAll('.close-modal-btn, .btn-secondary').forEach(btn => btn.addEventListener('click', () => closeModal(deleteModal)));
    closeMilestoneModal.querySelectorAll('.close-modal-btn, .btn-secondary').forEach(btn => btn.addEventListener('click', () => closeModal(closeMilestoneModal)));

    // Botão de confirmar exclusão
    confirmDeleteBtn.addEventListener('click', () => {
        if (currentItem) currentItem.remove();
        closeModal(deleteModal);
    });
    
    // Botão de confirmar fechamento
    confirmCloseBtn.addEventListener('click', () => {
        if (currentItem) {
            currentItem.classList.add('closed');
            renderList();
        }
        closeModal(closeMilestoneModal);
    });

    // CORRIGIDO: Lógica do botão de Sort
    sortBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        optionsMenu.style.display = 'none'; // Esconde o outro menu
        sortMenu.style.display = sortMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Lógica para abrir o menu de opções "..."
    milestoneList.addEventListener('click', (e) => {
        const optionsBtn = e.target.closest('.milestone-options-btn');
        if (optionsBtn) {
            e.stopPropagation();
            sortMenu.style.display = 'none'; // Esconde o outro menu
            currentItem = optionsBtn.closest('.milestone-item');
            optionsMenu.style.display = 'block';
            optionsMenu.style.top = `${optionsBtn.getBoundingClientRect().bottom + window.scrollY}px`;
            optionsMenu.style.left = `${optionsBtn.getBoundingClientRect().right - optionsMenu.offsetWidth}px`;
        }
    });
    
    // Eventos para os botões do menu de opções ("...")
    optionsMenu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if(!menuItem) return;
        
        optionsMenu.style.display = 'none';
        
        const targetId = menuItem.id;
        if (targetId === 'edit-milestone-option') {
            openModalForEdit(currentItem);
        } else if (targetId === 'delete-milestone-option') {
            deleteModal.classList.add('visible');
        } else if (targetId === 'close-milestone-option') {
            closeMilestoneModal.classList.add('visible');
        }
    });

    // Fecha os menus ao clicar fora
    document.addEventListener('click', () => {
        if(sortMenu) sortMenu.style.display = 'none';
        if(optionsMenu) optionsMenu.style.display = 'none';
    });

    // Renderiza a lista inicial com o filtro
    renderList();
}