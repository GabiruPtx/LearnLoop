export function setupSizeSettings() {
    const container = document.querySelector('.size-settings-container');
    if (!container) return;

    // Elementos da UI de Tamanho
    const sizeList = document.getElementById('size-list');
    const addSizeBtn = document.getElementById('addSizeBtn');
    const newSizeInput = document.getElementById('newSizeInput');
    
    // Menu de opções e seus botões
    const optionsMenu = document.getElementById('size-options-menu');
    const editOptionBtn = document.getElementById('edit-size-option');
    const removeOptionBtn = document.getElementById('remove-size-option');

    // Modal de Edição
    const editModal = document.getElementById('editSizeModal');
    const editLabelInput = document.getElementById('editSizeLabel');
    const editDescriptionInput = document.getElementById('editSizeDescription');
    const colorPicker = document.getElementById('editSizeColorPicker');
    const saveEditBtn = document.getElementById('saveEditSizeBtn');
    
    // Modal de Exclusão
    const deleteModal = document.getElementById('deleteSizeModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteSizeBtn');

    let currentItem = null; // Guarda o <li> que está sendo manipulado

    // --- LÓGICA DE ADICIONAR NOVO TAMANHO ---
    addSizeBtn.addEventListener('click', () => {
        const name = newSizeInput.value.trim();
        if (name === "") {
            alert("Por favor, digite o nome do novo tamanho.");
            return;
        }
        addSizeToList({ name });
        newSizeInput.value = '';
    });

    function addSizeToList(data) {
        const li = document.createElement('li');
        li.className = 'size-item';
        li.draggable = true;
        li.dataset.id = data.id || Date.now(); 

        const colorClass = data.colorClass || 's-gray'; // Cor padrão para novos tamanhos
        const description = data.description || '';

        li.innerHTML = `
            <div class="size-handle">::</div>
            <div class="size-tag-container">
                <span class="size-tag ${colorClass}" data-color-class="${colorClass}">${data.name}</span>
            </div>
            <div class="size-description">
                <input type="text" value="${description}" readonly>
            </div>
            <button class="size-options-btn">...</button>
        `;
        sizeList.appendChild(li);
    }

    // --- LÓGICA DO MENU DE OPÇÕES (EDITAR/REMOVER) ---
    sizeList.addEventListener('click', (e) => {
        if (e.target.classList.contains('size-options-btn')) {
            currentItem = e.target.closest('.size-item');
            optionsMenu.style.display = 'block';
            optionsMenu.style.top = `${e.target.offsetTop + e.target.offsetHeight}px`;
            optionsMenu.style.left = `${e.target.offsetLeft - optionsMenu.offsetWidth + e.target.offsetWidth}px`;
        }
    });

    document.addEventListener('click', (e) => {
        if (!optionsMenu.contains(e.target) && !e.target.classList.contains('size-options-btn')) {
            optionsMenu.style.display = 'none';
        }
    });

    // --- LÓGICA DO MODAL DE EDIÇÃO ---
    function openEditModal() {
        if (!currentItem) return;
        
        const labelSpan = currentItem.querySelector('.size-tag');
        const descriptionInput = currentItem.querySelector('.size-description input');
        
        editLabelInput.value = labelSpan.textContent;
        editDescriptionInput.value = descriptionInput.value;

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
        
        if (!newLabel || !selectedColorSwatch) return;
        
        const newColorClass = selectedColorSwatch.dataset.colorClass;
        const labelSpan = currentItem.querySelector('.size-tag');
        labelSpan.textContent = newLabel;
        labelSpan.className = `size-tag ${newColorClass}`;
        labelSpan.dataset.colorClass = newColorClass;
        currentItem.querySelector('.size-description input').value = newDescription;
        closeModal(editModal);
    });
    
    // --- LÓGICA DO MODAL DE EXCLUSÃO ---
    function openDeleteModal() {
        deleteModal.classList.add('visible');
        optionsMenu.style.display = 'none';
    }

    confirmDeleteBtn.addEventListener('click', () => {
        if (currentItem) currentItem.remove();
        closeModal(deleteModal);
    });

    // --- EVENTOS E FUNÇÕES GERAIS ---
    editOptionBtn.addEventListener('click', openEditModal);
    removeOptionBtn.addEventListener('click', openDeleteModal);

    function closeModal(modal) {
        modal.classList.remove('visible');
    }
    editModal.querySelectorAll('.close-modal-btn, #cancelEditSizeBtn').forEach(btn => btn.addEventListener('click', () => closeModal(editModal)));
    deleteModal.querySelectorAll('.close-modal-btn, #cancelDeleteSizeBtn').forEach(btn => btn.addEventListener('click', () => closeModal(deleteModal)));
    
    // --- LÓGICA DE DRAG & DROP ---
    let draggedItem = null;
    sizeList.addEventListener('dragstart', (e) => {
        if(e.target.classList.contains('size-item')) {
            draggedItem = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });
    sizeList.addEventListener('dragend', () => {
        if(draggedItem) draggedItem.classList.remove('dragging');
    });
    sizeList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(sizeList, e.clientY);
        if (draggedItem) {
            if (afterElement == null) {
                sizeList.appendChild(draggedItem);
            } else {
                sizeList.insertBefore(draggedItem, afterElement);
            }
        }
    });

    function getDragAfterElement(list, y) {
        const draggableElements = [...list.querySelectorAll('.size-item:not(.dragging)')];
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