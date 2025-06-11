import { getCookie } from './utils.js';

/**
 * Determina se uma cor hexadecimal é clara ou escura para definir a cor do texto.
 * @param {string} hexcolor - A cor em formato hexadecimal (ex: '#RRGGBB').
 * @returns {boolean} - Retorna `true` se a cor for clara, `false` se for escura.
 */
function isColorLight(hexcolor) {
    if (!hexcolor || !hexcolor.startsWith('#')) return true;
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 150;
}

const PREDEFINED_COLORS = [
    '#d73a4a', '#0075ca', '#a2eeef', '#7ef9ab', '#f5d76e', '#fbca04',
    '#f975a2', '#e4e669', '#0e8a16', '#5319e7', '#f29513', '#c2e0c6',
    '#bfd4f2', '#bfdadc', '#d4c5f9', '#f9d0c4'
];

function generateStyledColor() {
    return PREDEFINED_COLORS[Math.floor(Math.random() * PREDEFINED_COLORS.length)];
}

export function setupLabelSettings() {
    const container = document.getElementById('tags-labels');
    if (!container) return;

    const searchInput = document.getElementById('label-search-input');
    const newLabelBtn = document.getElementById('new-label-btn');
    const listHeaderCount = document.getElementById('label-count');
    const labelsList = document.getElementById('labels-list');
    const labelModal = document.getElementById('label-modal');
    const deleteModal = document.getElementById('deleteLabelModal');
    const optionsMenu = document.getElementById('label-options-menu');
    const modalTitle = document.getElementById('label-modal-title');
    const labelForm = document.getElementById('label-form');
    const labelPreview = document.getElementById('label-preview');
    const nameInput = document.getElementById('label-name-input');
    const descriptionInput = document.getElementById('label-description-input');
    const colorInput = document.getElementById('label-color-input');
    const colorRefreshBtn = document.getElementById('color-refresh-btn');
    const saveBtn = document.getElementById('save-label-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-label-btn');

    let currentLabelItem = null;
    let allLabels = [];
    const ajaxUrl = window.MANAGE_LABELS_URL;
    if (!ajaxUrl) {
        console.error("URL para gerenciar labels não encontrada.");
        return;
    }

    async function postData(action, data) {
        try {
            const response = await fetch(ajaxUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
                body: JSON.stringify({ action, ...data })
            });
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return { status: 'error', message: 'Erro de comunicação.' };
        }
    }

    async function fetchLabels() {
        labelsList.innerHTML = `<li class="label-list-item" style="justify-content: center; color: #777;">Carregando...</li>`;
        try {
            const response = await fetch(ajaxUrl);
            const data = await response.json();
            if (data.status === 'success') {
                allLabels = data.labels;
                renderList();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            labelsList.innerHTML = `<li class="label-list-item" style="justify-content: center; color: red;">Erro ao carregar labels.</li>`;
        }
    }

    function renderList(labelsToRender = allLabels) {
        labelsList.innerHTML = '';
        if (labelsToRender.length === 0) {
            const message = searchInput.value ? 'Nenhuma label corresponde à sua busca.' : 'Ainda não há labels neste projeto.';
            labelsList.innerHTML = `<li class="label-list-item" style="justify-content: center; color: #777;">${message}</li>`;
        } else {
            labelsToRender.forEach(label => {
                const li = document.createElement('li');
                li.className = 'label-list-item';
                li.dataset.labelId = label.id;
                li.dataset.labelName = label.name;
                li.dataset.labelDescription = label.description || '';
                li.dataset.labelColor = label.color;

                const color = label.color;
                const textColor = isColorLight(color) ? '#000000' : '#FFFFFF';

                li.innerHTML = `
                    <div class="label-tag-wrapper">
                        <span class="label-tag" style="background-color: ${color}; border-color: ${color}; color: ${textColor};">${label.name}</span>
                    </div>
                    <div class="label-description">${label.description || ''}</div>
                    <button class="label-options-btn">...</button>
                `;
                labelsList.appendChild(li);
            });
        }
        listHeaderCount.textContent = allLabels.length;
    }

    function updatePreview() {
        const name = nameInput.value.trim() || 'Prévia da Label';
        const color = colorInput.value.trim();
        labelPreview.textContent = name;
        if (/^#[0-9A-F]{6}$/i.test(color)) {
            labelPreview.style.backgroundColor = color;
            labelPreview.style.borderColor = color;
            labelPreview.style.color = isColorLight(color) ? '#000000' : '#FFFFFF';
        }
    }

    function openModalForCreate() {
        currentLabelItem = null;
        labelForm.reset();
        modalTitle.textContent = "Nova label";
        saveBtn.textContent = "Criar label";
        colorInput.value = generateStyledColor();
        updatePreview();
        labelModal.classList.add('visible');
    }

    function openModalForEdit(li_element) {
        currentLabelItem = li_element;
        modalTitle.textContent = "Editar label";
        saveBtn.textContent = "Salvar alterações";

        nameInput.value = li_element.dataset.labelName;
        descriptionInput.value = li_element.dataset.labelDescription;
        colorInput.value = li_element.dataset.labelColor;

        updatePreview();
        labelModal.classList.add('visible');
    }

    function closeModal(modal) {
        if (modal) modal.classList.remove('visible');
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        saveBtn.disabled = true;

        const action = currentLabelItem ? 'update' : 'create';
        const data = {
            id: currentLabelItem ? currentLabelItem.dataset.labelId : null,
            name: nameInput.value.trim(),
            description: descriptionInput.value.trim(),
            color: colorInput.value.trim()
        };

        const result = await postData(action, data);

        if (result.status === 'success') {
            closeModal(labelModal);
            fetchLabels(); // Recarrega a lista do backend
        } else {
            alert(`Erro: ${result.message}`);
        }
        saveBtn.disabled = false;
    }

    newLabelBtn.addEventListener('click', openModalForCreate);

    colorRefreshBtn.addEventListener('click', () => {
        colorInput.value = generateStyledColor();
        updatePreview();
    });

    [nameInput, colorInput].forEach(input => input.addEventListener('input', updatePreview));

    labelsList.addEventListener('click', (e) => {
        const optionsBtn = e.target.closest('.label-options-btn');
        if (optionsBtn) {
            e.stopPropagation();
            currentLabelItem = optionsBtn.closest('.label-list-item');
            optionsMenu.style.display = 'block';
            const rect = optionsBtn.getBoundingClientRect();
            optionsMenu.style.top = `${rect.bottom + window.scrollY}px`;
            optionsMenu.style.left = `${rect.right - optionsMenu.offsetWidth}px`;
        }
    });

    optionsMenu.addEventListener('click', (e) => {
        optionsMenu.style.display = 'none';
        if (!currentLabelItem) return;

        if (e.target.id === 'edit-label-option') {
            openModalForEdit(currentLabelItem);
        } else if (e.target.id === 'delete-label-option') {
            deleteModal.classList.add('visible');
        }
    });

    labelForm.addEventListener('submit', handleFormSubmit);

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const filtered = allLabels.filter(label =>
            label.name.toLowerCase().includes(query) ||
            (label.description && label.description.toLowerCase().includes(query))
        );
        renderList(filtered);
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        if (!currentLabelItem) return;
        confirmDeleteBtn.disabled = true;

        const result = await postData('delete', { id: currentLabelItem.dataset.labelId });

        if(result.status === 'success') {
            closeModal(deleteModal);
            fetchLabels(); // Recarrega a lista
        } else {
            alert(`Erro: ${result.message}`);
        }
        confirmDeleteBtn.disabled = false;
    });

    labelModal.querySelectorAll('.close-modal-btn, .btn-secondary').forEach(btn => btn.addEventListener('click', () => closeModal(labelModal)));
    deleteModal.querySelectorAll('.close-modal-btn, .btn-secondary').forEach(btn => btn.addEventListener('click', () => closeModal(deleteModal)));

    document.addEventListener('click', () => {
        optionsMenu.style.display = 'none';
    });

    fetchLabels();
}