let selectedLabelIds = new Set();

/**
 * Retorna um array com os IDs das labels selecionadas.
 * @returns {string[]}
 */
export function getSelectedLabels() {
  return Array.from(selectedLabelIds);
}

export function setSelectedLabels(ids = []) {
  selectedLabelIds = new Set(ids.map(String));
}
/**
 * Limpa a seleção de labels e desmarca as checkboxes na interface.
 */
export function clearSelectedLabels() {
  selectedLabelIds.clear();
  const listContainer = document.getElementById('label-list-container');
  if (listContainer) {
      listContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
          checkbox.checked = false;
      });
  }
}

/**
 * Configura o menu de seleção de labels.
 */
export function setupLabelMenu() {
    const openButton = document.getElementById('openLabelMenuButton');
    const menu = document.getElementById('label-menu');
    const listContainer = document.getElementById('label-list-container');
    const projectId = window.PROJECT_ID;

    if (!openButton || !menu || !listContainer || !projectId) {
        return; // Sai se os elementos essenciais não forem encontrados
    }

    // Ouve por mudanças nas checkboxes para atualizar o Set de selecionados
    listContainer.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const labelId = event.target.value;
            if (event.target.checked) {
                selectedLabelIds.add(labelId);
            } else {
                selectedLabelIds.delete(labelId);
            }
        }
    });

    /**
     * Busca as labels do projeto e preenche a lista no menu.
     */
    async function fetchAndPopulateLabels() {
        if (typeof window.MANAGE_LABELS_URL === 'undefined' || !window.MANAGE_LABELS_URL) {
            console.error('URL para buscar labels (MANAGE_LABELS_URL) não está definida.');
            listContainer.innerHTML = '<div class="assignee-item" style="padding: 10px;">Erro ao carregar.</div>';
            return;
        }

        try {
            const response = await fetch(window.MANAGE_LABELS_URL);
            const data = await response.json();

            if (data.status === 'success' && data.labels.length > 0) {
                listContainer.innerHTML = ''; // Limpa a lista
                data.labels.forEach(l => {
                    const isChecked = selectedLabelIds.has(l.id.toString());
                    const item = document.createElement('div');
                    item.className = 'assignee-item'; // Reutiliza o estilo
                    item.innerHTML = `
                        <label style="display: flex; align-items: center; cursor: pointer; width: 100%;">
                            <input type="checkbox" name="task_label" value="${l.id}" ${isChecked ? 'checked' : ''} style="margin-right: 8px; flex-shrink: 0;">
                            <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: ${l.color}; margin-right: 8px; flex-shrink: 0;"></span>
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${l.name}</span>
                        </label>
                    `;
                    listContainer.appendChild(item);
                });
            } else {
                const configUrl = `/projeto/${projectId}/configuracao/`;
                listContainer.innerHTML = `<div class="assignee-item" style="padding: 10px;">Nenhuma label no projeto. <a href="${configUrl}" style="color: #0075ca;">Criar uma.</a></div>`;
            }
        } catch (error) {
            console.error('Falha ao buscar labels:', error);
            listContainer.innerHTML = '<div class="assignee-item" style="padding: 10px;">Erro de comunicação.</div>';
        }
    }

    function openMenu() {
        fetchAndPopulateLabels();
        const btnRect = openButton.getBoundingClientRect();
        menu.style.display = 'block';
        menu.style.top = `${btnRect.bottom + 5}px`;
        menu.style.left = `${btnRect.left}px`;
        menu.classList.add('active');
        document.addEventListener('click', closeMenuOnClickOutside, true);
    }

    function closeMenu() {
        menu.style.display = 'none';
        menu.classList.remove('active');
        document.removeEventListener('click', closeMenuOnClickOutside, true);
    }

    function closeMenuOnClickOutside(event) {
        if (!menu.contains(event.target) && !openButton.contains(event.target)) {
            closeMenu();
        }
    }

    openButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (menu.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });
}