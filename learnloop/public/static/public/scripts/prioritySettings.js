export function setupPrioritySettings() {
    const container = document.querySelector('.priority-settings-container');
    if (!container) return;

    // Elementos da UI
    const priorityList = document.getElementById('priority-list');
    const addPriorityBtn = document.getElementById('addPriorityBtn');
    const newPriorityInput = document.getElementById('newPriorityInput');
    
    // Menu de opções e seus botões
    const optionsMenu = document.getElementById('priority-options-menu');
    const editOptionBtn = document.getElementById('edit-priority-option');
    const removeOptionBtn = document.getElementById('remove-priority-option');

    // Modal de Edição
    const editModal = document.getElementById('editPriorityModal');
    const editLabelInput = document.getElementById('editPriorityLabel');
    const editDescriptionInput = document.getElementById('editPriorityDescription');
    const colorPicker = document.getElementById('editPriorityColorPicker');
    const saveEditBtn = document.getElementById('saveEditBtn');
    
    // Modal de Exclusão
    const deleteModal = document.getElementById('deletePriorityModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    let currentItem = null; // Guarda o <li> que está sendo manipulado

    // --- LÓGICA DE ADICIONAR NOVA PRIORIDADE ---
    addPriorityBtn.addEventListener('click', () => {
        const name = newPriorityInput.value.trim();
        if (name === "") {
            alert("Por favor, digite o nome da nova prioridade.");
            return;
        }
        addPriorityToList({ name });
        newPriorityInput.value = '';
    });

    function addPriorityToList(data) {
        const li = document.createElement('li');
        li.className = 'priority-item';
        li.draggable = true;
        li.dataset.id = data.id || Date.now(); // ID temporário se não vier do DB

        const colorClass = data.colorClass || 'p-new';
        const description = data.description || '';

        li.innerHTML = `
            <div class="priority-handle">::</div>
            <div class="priority-tag-container">
                <span class="priority-tag ${colorClass}" data-color-class="${colorClass}">${data.name}</span>
            </div>
            <div class="priority-description">
                <input type="text" value="${description}" readonly>
            </div>
            <button class="priority-options-btn">...</button>
        `;
        priorityList.appendChild(li);
    }

    // --- LÓGICA DO MENU DE OPÇÕES (EDITAR/REMOVER) ---
    priorityList.addEventListener('click', (e) => {
        if (e.target.classList.contains('priority-options-btn')) {
            currentItem = e.target.closest('.priority-item');
            optionsMenu.style.display = 'block';
            optionsMenu.style.top = `${e.target.offsetTop + e.target.offsetHeight}px`;
            optionsMenu.style.left = `${e.target.offsetLeft - optionsMenu.offsetWidth + e.target.offsetWidth}px`;
        }
    });

    // Fechar menu ao clicar fora
    document.addEventListener('click', (e) => {
        if (!optionsMenu.contains(e.target) && !e.target.classList.contains('priority-options-btn')) {
            optionsMenu.style.display = 'none';
        }
    });

    // --- LÓGICA DO MODAL DE EDIÇÃO ---
    function openEditModal() {
        if (!currentItem) return;
        
        // Popula o modal com os dados do item
        const labelSpan = currentItem.querySelector('.priority-tag');
        const descriptionInput = currentItem.querySelector('.priority-description input');
        
        editLabelInput.value = labelSpan.textContent;
        editDescriptionInput.value = descriptionInput.value;

        // Seleciona a cor atual no picker
        const currentColorClass = labelSpan.dataset.colorClass;
        colorPicker.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.toggle('selected', swatch.dataset.colorClass === currentColorClass);
        });

        editModal.classList.add('visible');
        optionsMenu.style.display = 'none';
    }

    colorPicker.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-swatch')) {
            colorPicker.querySelector('.selected')?.classList.remove('selected');
            e.target.classList.add('selected');
        }
    });

    saveEditBtn.addEventListener('click', () => {
        if (!currentItem) return;

        const newLabel = editLabelInput.value.trim();
        const newDescription = editDescriptionInput.value.trim();
        const selectedColorSwatch = colorPicker.querySelector('.selected');
        
        if (!newLabel || !selectedColorSwatch) {
            alert("O nome e a cor são obrigatórios.");
            return;
        }

        const newColorClass = selectedColorSwatch.dataset.colorClass;

        // Atualiza o item na lista
        const labelSpan = currentItem.querySelector('.priority-tag');
        labelSpan.textContent = newLabel;
        labelSpan.className = `priority-tag ${newColorClass}`;
        labelSpan.dataset.colorClass = newColorClass;
        
        currentItem.querySelector('.priority-description input').value = newDescription;

        closeModal(editModal);
    });
    
    // --- LÓGICA DO MODAL DE EXCLUSÃO ---
    function openDeleteModal() {
        deleteModal.classList.add('visible');
        optionsMenu.style.display = 'none';
    }

    confirmDeleteBtn.addEventListener('click', () => {
        if (currentItem) {
            currentItem.remove();
        }
        closeModal(deleteModal);
    });

    // --- EVENTOS DOS MENUS E MODAIS ---
    editOptionBtn.addEventListener('click', openEditModal);
    removeOptionBtn.addEventListener('click', openDeleteModal);

    // Funções genéricas para fechar modais
    function closeModal(modal) {
        modal.classList.remove('visible');
    }
    editModal.querySelectorAll('.close-modal-btn, #cancelEditBtn').forEach(btn => btn.addEventListener('click', () => closeModal(editModal)));
    deleteModal.querySelectorAll('.close-modal-btn, #cancelDeleteBtn').forEach(btn => btn.addEventListener('click', () => closeModal(deleteModal)));
    
    // --- LÓGICA DE DRAG & DROP ---
    let draggedItem = null;

    priorityList.addEventListener('dragstart', (e) => {
        draggedItem = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
    });

    priorityList.addEventListener('dragend', (e) => {
        draggedItem.classList.remove('dragging');
        draggedItem = null;
    });

    priorityList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(priorityList, e.clientY);
        if (afterElement == null) {
            priorityList.appendChild(draggedItem);
        } else {
            priorityList.insertBefore(draggedItem, afterElement);
        }
    });

    function getDragAfterElement(list, y) {
        const draggableElements = [...list.querySelectorAll('.priority-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}