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

// Lista de cores pré-definidas inspirada no GitHub para garantir um bom design.
const PREDEFINED_COLORS = [
    '#d73a4a', '#0075ca', '#a2eeef', '#7ef9ab', '#f5d76e', '#fbca04',
    '#f975a2', '#e4e669', '#0e8a16', '#5319e7', '#f29513', '#c2e0c6',
    '#bfd4f2', '#bfdadc', '#d4c5f9', '#f9d0c4'
];

/**
 * Retorna uma cor aleatória da lista de cores pré-definidas.
 */
function generateStyledColor() {
    return PREDEFINED_COLORS[Math.floor(Math.random() * PREDEFINED_COLORS.length)];
}

/**
 * Configura toda a interatividade para a aba de gerenciamento de Tags/Labels.
 */
export function setupLabelSettings() {
    const container = document.getElementById('tags-labels');
    if (!container) return;

    // --- Elementos da UI ---
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

    // --- Variáveis de Estado ---
    let currentLabelItem = null;
    let allLabels = [];

    // --- Funções ---

    /** Renderiza a lista de labels na tela */
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
    
    /** Atualiza a prévia da label no modal */
    function updatePreview() {
        const name = nameInput.value.trim() || 'Prévia da Label';
        const color = colorInput.value.trim();
        labelPreview.textContent = name;
        if (/^#[0-9A-F]{6}$/i.test(color)) {
            labelPreview.style.backgroundColor = color;
            labelPreview.style.borderColor = color; // Borda e fundo com a mesma cor
            labelPreview.style.color = isColorLight(color) ? '#000000' : '#FFFFFF';
        }
    }

    /** Abre o modal para criar uma nova label */
    function openModalForCreate() {
        currentLabelItem = null;
        labelForm.reset();
        modalTitle.textContent = "Nova label";
        saveBtn.textContent = "Criar label";
        colorInput.value = generateStyledColor();
        updatePreview();
        labelModal.classList.add('visible');
    }
    
    /** Abre o modal para editar uma label existente */
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

    /** Fecha um modal específico */
    function closeModal(modal) {
        if (modal) modal.classList.remove('visible');
    }

    /** Lida com o envio do formulário de criação/edição */
    function handleFormSubmit(e) {
        e.preventDefault();
        console.log("Formulário enviado. Lógica do backend a ser implementada.");
        closeModal(labelModal);
    }

    // --- Event Listeners ---
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

    confirmDeleteBtn.addEventListener('click', () => {
        console.log(`Excluindo label com ID: ${currentLabelItem.dataset.labelId}`);
        closeModal(deleteModal);
    });
    
    labelModal.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', () => closeModal(labelModal)));
    deleteModal.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', () => closeModal(deleteModal)));

    document.addEventListener('click', () => {
        optionsMenu.style.display = 'none';
    });

    renderList();
}