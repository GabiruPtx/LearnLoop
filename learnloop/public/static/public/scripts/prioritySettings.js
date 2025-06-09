// learnloop/public/static/public/scripts/prioritySettings.js

import { getCookie } from './utils.js';

export function setupPrioritySettings() {
    const container = document.querySelector('.priority-settings-container');
    if (!container) return;

    // Elementos da UI
    const priorityList = document.getElementById('priority-list');
    const addPriorityBtn = document.getElementById('addPriorityBtn');
    const newPriorityInput = document.getElementById('newPriorityInput');
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

    let currentItem = null;
    let selectedColor = null; // Variável para guardar a cor selecionada no modal
    const ajaxUrl = window.MANAGE_PRIORITIES_URL;
    if (!ajaxUrl) {
        console.error("URL para gerenciar prioridades não encontrada.");
        return;
    }

    // --- FUNÇÕES DE COMUNICAÇÃO COM O BACKEND ---

    async function postData(action, data = {}) {
        try {
            const response = await fetch(ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({ action, ...data }),
            });
            return await response.json();
        } catch (error) {
            console.error("Fetch Error:", error);
            return { status: 'error', message: 'Erro de comunicação.' };
        }
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO E UI ---

    function renderPriorityItem(priority) {
        const li = document.createElement('li');
        li.className = 'priority-item';
        li.draggable = true;
        li.dataset.id = priority.id;
        li.dataset.color = priority.cor; // Armazena a cor no dataset

        li.innerHTML = `
            <div class="priority-handle">::</div>
            <div class="priority-tag-container">
                <span class="priority-tag" style="background-color:${priority.cor}; color: white;">${priority.nome}</span>
            </div>
            <div class="priority-description">
                <input type="text" value="${priority.descricao || ''}" readonly>
            </div>
            <button class="priority-options-btn">...</button>
        `;
        return li;
    }

    async function loadPriorities() {
        priorityList.innerHTML = '<li>Carregando...</li>';
        const response = await fetch(ajaxUrl);
        const data = await response.json();
        priorityList.innerHTML = '';
        if (data.status === 'success' && data.prioridades) {
            data.prioridades.forEach(p => {
                const item = renderPriorityItem(p);
                priorityList.appendChild(item);
            });
        } else {
            priorityList.innerHTML = '<li>Erro ao carregar prioridades.</li>';
        }
    }

    // --- LÓGICA DOS EVENTOS ---

    // Adicionar
    addPriorityBtn.addEventListener('click', async () => {
        const name = newPriorityInput.value.trim();
        if (name === "") return;

        const result = await postData('add', { nome: name });
        if (result.status === 'success') {
            const newItem = renderPriorityItem(result.prioridade);
            priorityList.appendChild(newItem);
            newPriorityInput.value = '';
        } else {
            alert(`Erro: ${result.message}`);
        }
    });

    // Abrir Modal de Edição
    editOptionBtn.addEventListener('click', () => {
        if (!currentItem) return;

        editLabelInput.value = currentItem.querySelector('.priority-tag').textContent;
        editDescriptionInput.value = currentItem.querySelector('.priority-description input').value;

        selectedColor = currentItem.dataset.color;
        const swatches = colorPicker.querySelectorAll('.color-swatch');
        swatches.forEach(swatch => {
            swatch.classList.remove('selected');
            // CORREÇÃO: Usa getComputedStyle para ler a cor da classe CSS
            if (rgbToHex(window.getComputedStyle(swatch).backgroundColor) === selectedColor) {
                swatch.classList.add('selected');
            }
        });

        editModal.classList.add('visible');
        optionsMenu.style.display = 'none';
    });

    // Salvar Edição
    saveEditBtn.addEventListener('click', async () => {
        if (!currentItem) return;

        const updatedData = {
            id: currentItem.dataset.id,
            nome: editLabelInput.value.trim(),
            description: editDescriptionInput.value.trim(),
            color: selectedColor
        };

        const result = await postData('update', updatedData);
        if (result.status === 'success') {
            const tag = currentItem.querySelector('.priority-tag');
            tag.textContent = updatedData.nome;
            tag.style.backgroundColor = updatedData.color;
            currentItem.querySelector('.priority-description input').value = updatedData.description;
            currentItem.dataset.color = updatedData.color;

            closeModal(editModal);
        } else {
            alert(`Erro: ${result.message}`);
        }
    });

    // Confirmar Exclusão
    confirmDeleteBtn.addEventListener('click', async () => {
        if (!currentItem) return;
        const result = await postData('delete', { id: currentItem.dataset.id });
        if (result.status === 'success') {
            currentItem.remove();
            closeModal(deleteModal);
        } else {
            alert(`Erro: ${result.message}`);
        }
    });

    // Reordenar com Drag & Drop
    priorityList.addEventListener('dragend', async () => {
        const orderedIds = [...priorityList.querySelectorAll('.priority-item')].map(item => item.dataset.id);
        await postData('reorder', { order: orderedIds });
    });


    // --- MANIPULADORES DE EVENTOS DA UI (MODAIS, MENUS) ---
    colorPicker.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-swatch')) {
            colorPicker.querySelector('.selected')?.classList.remove('selected');
            e.target.classList.add('selected');
            // CORREÇÃO: Usa getComputedStyle para ler a cor da classe CSS
            selectedColor = rgbToHex(window.getComputedStyle(e.target).backgroundColor);
        }
    });

    priorityList.addEventListener('click', (e) => {
        if (e.target.classList.contains('priority-options-btn')) {
            currentItem = e.target.closest('.priority-item');
            optionsMenu.style.display = 'block';
            const rect = e.target.getBoundingClientRect();
            optionsMenu.style.top = `${rect.bottom + window.scrollY}px`;
            optionsMenu.style.left = `${rect.left - optionsMenu.offsetWidth + rect.width}px`;
        }
    });

    removeOptionBtn.addEventListener('click', () => {
        deleteModal.classList.add('visible');
        optionsMenu.style.display = 'none';
    });

    function closeModal(modal) {
        modal.classList.remove('visible');
    }
    [editModal, deleteModal].forEach(modal => {
        modal.querySelectorAll('.close-modal-btn, .btn-secondary').forEach(btn => {
            btn.addEventListener('click', () => closeModal(modal));
        });
    });

    // --- Lógica de Drag & Drop ---
    let draggedItem = null;
    priorityList.addEventListener('dragstart', (e) => {
        if (!e.target.classList.contains('priority-item')) return;
        draggedItem = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
    });
    priorityList.addEventListener('dragend', () => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
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

    // Função para converter rgb para hex
    function rgbToHex(rgb) {
        if (!rgb || !rgb.includes('rgb')) return '#808080'; // Retorna cinza se não for uma cor válida
        let sep = rgb.indexOf(",") > -1 ? "," : " ";
        rgb = rgb.substr(4).split(")")[0].split(sep);
        let r = (+rgb[0]).toString(16),
            g = (+rgb[1]).toString(16),
            b = (+rgb[2]).toString(16);
        if (r.length == 1) r = "0" + r;
        if (g.length == 1) g = "0" + g;
        if (b.length == 1) b = "0" + b;
        return "#" + r + g + b;
    }


    // --- INICIALIZAÇÃO ---
    loadPriorities();
}