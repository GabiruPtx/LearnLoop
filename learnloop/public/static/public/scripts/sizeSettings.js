// learnloop/public/static/public/scripts/sizeSettings.js

import { getCookie } from './utils.js';

export function setupSizeSettings() {
    const container = document.querySelector('.size-settings-container');
    if (!container) return;

    // Elementos da UI
    const sizeList = document.getElementById('size-list');
    const addSizeBtn = document.getElementById('addSizeBtn');
    const newSizeInput = document.getElementById('newSizeInput');
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

    let currentItem = null;
    let selectedColor = null; // Variável para guardar a cor selecionada no modal
    const ajaxUrl = window.MANAGE_SIZES_URL;
    if (!ajaxUrl) {
        console.error("URL para gerenciar tamanhos não encontrada.");
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

    function renderSizeItem(size) {
        const li = document.createElement('li');
        li.className = 'size-item';
        li.draggable = true;
        li.dataset.id = size.id;
        li.dataset.color = size.cor; // Armazena a cor no dataset

        li.innerHTML = `
            <div class="size-handle">::</div>
            <div class="size-tag-container">
                <span class="size-tag" style="background-color:${size.cor}; color: white;">${size.nome}</span>
            </div>
            <div class="size-description">
                <input type="text" value="${size.descricao || ''}" readonly>
            </div>
            <button class="size-options-btn">...</button>
        `;
        return li;
    }

    async function loadSizes() {
        sizeList.innerHTML = '<li>Carregando...</li>';
        const response = await fetch(ajaxUrl);
        const data = await response.json();
        sizeList.innerHTML = '';
        if (data.status === 'success' && data.tamanhos) {
            data.tamanhos.forEach(p => {
                const item = renderSizeItem(p);
                sizeList.appendChild(item);
            });
        } else {
            sizeList.innerHTML = '<li>Erro ao carregar tamanhos.</li>';
        }
    }

    // --- LÓGICA DOS EVENTOS ---

    // Adicionar
    addSizeBtn.addEventListener('click', async () => {
        const name = newSizeInput.value.trim();
        if (name === "") return;

        const result = await postData('add', { nome: name });
        if (result.status === 'success') {
            const newItem = renderSizeItem(result.tamanho);
            sizeList.appendChild(newItem);
            newSizeInput.value = '';
        } else {
            alert(`Erro: ${result.message}`);
        }
    });

    // Abrir Modal de Edição
    editOptionBtn.addEventListener('click', () => {
        if (!currentItem) return;

        editLabelInput.value = currentItem.querySelector('.size-tag').textContent;
        editDescriptionInput.value = currentItem.querySelector('.size-description input').value;

        selectedColor = currentItem.dataset.color;
        const swatches = colorPicker.querySelectorAll('.color-swatch');
        swatches.forEach(swatch => {
            swatch.classList.remove('selected');
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
            const tag = currentItem.querySelector('.size-tag');
            tag.textContent = updatedData.nome;
            tag.style.backgroundColor = updatedData.color;
            currentItem.querySelector('.size-description input').value = updatedData.description;
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
    sizeList.addEventListener('dragend', async () => {
        const orderedIds = [...sizeList.querySelectorAll('.size-item')].map(item => item.dataset.id);
        await postData('reorder', { order: orderedIds });
    });


    // --- MANIPULADORES DE EVENTOS DA UI (MODAIS, MENUS) ---
    colorPicker.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-swatch')) {
            colorPicker.querySelector('.selected')?.classList.remove('selected');
            e.target.classList.add('selected');
            selectedColor = rgbToHex(window.getComputedStyle(e.target).backgroundColor);
        }
    });

    sizeList.addEventListener('click', (e) => {
        if (e.target.classList.contains('size-options-btn')) {
            currentItem = e.target.closest('.size-item');
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
    sizeList.addEventListener('dragstart', (e) => {
        if (!e.target.classList.contains('size-item')) return;
        draggedItem = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
    });
    sizeList.addEventListener('dragend', () => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
    });
    sizeList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(sizeList, e.clientY);
        if (afterElement == null) {
            sizeList.appendChild(draggedItem);
        } else {
            sizeList.insertBefore(draggedItem, afterElement);
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
    loadSizes();
}