let selectedMilestoneId = null;

/**
 * Retorna o ID do milestone selecionado.
 * @returns {string|null}
 */
export function getSelectedMilestone() {
  return selectedMilestoneId;
}

export function setSelectedMilestone(id = null) {
  selectedMilestoneId = id ? id.toString() : null;
}

/**
 * Limpa a seleção de milestone e os checkboxes na interface.
 */
export function clearSelectedMilestone() {
  selectedMilestoneId = null;
  const listContainer = document.getElementById('milestone-list-container');
  if (listContainer) {
      const allCheckboxes = listContainer.querySelectorAll('.milestone-checkbox');
      allCheckboxes.forEach(checkbox => {
          checkbox.checked = false;
      });
  }
}

/**
 * Configura o menu de seleção de milestone.
 */
export function setupMilestoneMenu() {
    const openButton = document.getElementById('openMilestoneMenuButton');
    const menu = document.getElementById('milestone-menu');
    const listContainer = document.getElementById('milestone-list-container');

    if (!openButton || !menu || !listContainer) {
        return;
    }

    // Ouve por mudanças nos checkboxes para selecionar um milestone
    listContainer.addEventListener('change', (event) => {
        const targetCheckbox = event.target;
        // Certifica-se de que o evento foi em um checkbox de milestone
        if (targetCheckbox.matches('.milestone-checkbox')) {
            // Desmarca todos os outros checkboxes se este foi marcado
            if (targetCheckbox.checked) {
                const allCheckboxes = listContainer.querySelectorAll('.milestone-checkbox');
                allCheckboxes.forEach(checkbox => {
                    if (checkbox !== targetCheckbox) {
                        checkbox.checked = false;
                    }
                });
                // Define o ID do milestone selecionado
                selectedMilestoneId = targetCheckbox.dataset.milestoneId;
            } else {
                // Se o usuário desmarcar a caixa, a seleção é limpa
                selectedMilestoneId = null;
            }
        }
    });

    /**
     * Busca os milestones do projeto e preenche a lista no menu.
     */
    async function fetchAndPopulateMilestones() {
        if (typeof getMilestonesUrl === 'undefined' || !getMilestonesUrl) {
            console.error('URL para buscar milestones (getMilestonesUrl) não está definida.');
            listContainer.innerHTML = '<div class="assignee-item" style="padding: 10px;">Erro ao carregar.</div>';
            return;
        }

        try {
            const response = await fetch(getMilestonesUrl);
            const data = await response.json();

            listContainer.innerHTML = ''; // Limpa a lista antes de popular

            if (data.status === 'success' && data.milestones.length > 0) {

                // Opção para não selecionar nenhum milestone
                const noMilestoneItem = document.createElement('div');
                noMilestoneItem.className = 'assignee-item'; // Reutiliza CSS
                const noMilestoneId = `milestone-none`;
                noMilestoneItem.innerHTML = `
                    <label for="${noMilestoneId}" class="assignee-label">
                        <input type="checkbox" id="${noMilestoneId}" name="milestone-selection" class="milestone-checkbox" data-milestone-id="">
                        <span class="assignee-name">Nenhum milestone</span>
                    </label>
                `;
                listContainer.appendChild(noMilestoneItem);

                // Popula com os milestones do projeto
                data.milestones.forEach(m => {
                    const item = document.createElement('div');
                    item.className = 'assignee-item'; // Reutiliza CSS
                    const milestoneId = `milestone-${m.id}`;
                    item.innerHTML = `
                        <label for="${milestoneId}" class="assignee-label">
                            <input type="checkbox" id="${milestoneId}" name="milestone-selection" class="milestone-checkbox" data-milestone-id="${m.id}">
                            <span class="assignee-name">${m.nome}</span>
                        </label>
                    `;
                    listContainer.appendChild(item);
                });
            } else {
                listContainer.innerHTML = '<div class="assignee-item" style="padding: 10px;">Nenhum milestone aberto.</div>';
            }

            // Garante que o estado visual (checkbox) corresponda à seleção atual
            const allCheckboxes = listContainer.querySelectorAll('.milestone-checkbox');
            allCheckboxes.forEach(checkbox => {
                // Compara o data-milestone-id do checkbox com o ID salvo
                checkbox.checked = (checkbox.dataset.milestoneId === selectedMilestoneId);
            });

        } catch (error) {
            console.error('Falha ao buscar milestones:', error);
            listContainer.innerHTML = '<div class="assignee-item" style="padding: 10px;">Erro de comunicação.</div>';
        }
    }

    function openMenu() {
        fetchAndPopulateMilestones(); // Busca e preenche os dados sempre que o menu é aberto
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