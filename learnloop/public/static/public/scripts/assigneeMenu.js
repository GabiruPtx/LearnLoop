
let selectedAssigneeIds = new Set();

/**
 * Retorna um array com os IDs dos responsáveis selecionados.
 * @returns {string[]}
 */
export function getSelectedAssignees() {
  return Array.from(selectedAssigneeIds);
}

/**
 * Limpa a seleção de responsáveis e desmarca as checkboxes na interface.
 */
export function clearSelectedAssignees() {
  selectedAssigneeIds.clear();
  const listContainer = document.getElementById('assignee-list-container');
  if (listContainer) {
      listContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
          checkbox.checked = false;
      });
  }
}

/**
 * Configura o menu de seleção de responsáveis (assignee menu).
 */
export function setupAssigneeMenu() {
    const openButton = document.getElementById('openAssigneeMenuButton');
    const menu = document.getElementById('assignee-menu');
    const listContainer = document.getElementById('assignee-list-container');

    if (!openButton || !menu || !listContainer) {
        return; // Sai se os elementos essenciais não forem encontrados
    }

    // Ouve por mudanças nas checkboxes para atualizar o Set de selecionados
    listContainer.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const assigneeId = event.target.value;
            if (event.target.checked) {
                selectedAssigneeIds.add(assigneeId);
            } else {
                selectedAssigneeIds.delete(assigneeId);
            }
        }
    });

    /**
     * Busca os participantes do projeto e preenche a lista no menu.
     */
    async function fetchAndPopulateAssignees() {
        if (typeof getParticipantsUrl === 'undefined' || !getParticipantsUrl) {
            console.error('URL para buscar participantes (getParticipantsUrl) não está definida.');
            listContainer.innerHTML = '<div class="assignee-item" style="padding: 10px;">Erro ao carregar.</div>';
            return;
        }

        try {
            const response = await fetch(getParticipantsUrl);
            const data = await response.json();

            if (data.status === 'success' && data.participantes.length > 0) {
                listContainer.innerHTML = ''; // Limpa a lista antes de adicionar os novos itens
                data.participantes.forEach(p => {
                    const isChecked = selectedAssigneeIds.has(p.id.toString());
                    const item = document.createElement('div');
                    item.className = 'assignee-item';
                    item.innerHTML = `
                        <label>
                            <input type="checkbox" name="task_assignee" value="${p.id}" ${isChecked ? 'checked' : ''}>
                            <span>${p.nome_completo}</span>
                        </label>
                    `;
                    listContainer.appendChild(item);
                });
            } else {
                listContainer.innerHTML = '<div class="assignee-item" style="padding: 10px;">Nenhum aluno no projeto.</div>';
            }
        } catch (error) {
            console.error('Falha ao buscar participantes:', error);
            listContainer.innerHTML = '<div class="assignee-item" style="padding: 10px;">Erro de comunicação.</div>';
        }
    }

    /**
     * Abre o menu de seleção.
     */
    function openMenu() {
        fetchAndPopulateAssignees();
        const btnRect = openButton.getBoundingClientRect();
        menu.style.display = 'block';
        menu.style.top = `${btnRect.bottom + 5}px`; // Posiciona abaixo do botão
        menu.style.left = `${btnRect.left}px`;    // Alinha com a esquerda do botão
        menu.classList.add('active');
        // Adiciona um listener para fechar o menu ao clicar fora
        document.addEventListener('click', closeMenuOnClickOutside, true);
    }

    /**
     * Fecha o menu de seleção.
     */
    function closeMenu() {
        menu.style.display = 'none';
        menu.classList.remove('active');
        document.removeEventListener('click', closeMenuOnClickOutside, true);
    }

    /**
     * Função auxiliar para fechar o menu quando o clique ocorre fora dele.
     */
    function closeMenuOnClickOutside(event) {
        if (!menu.contains(event.target) && !openButton.contains(event.target)) {
            closeMenu();
        }
    }

    // Adiciona o evento de clique ao botão para abrir/fechar o menu
    openButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Impede que o clique se propague para o document
        if (menu.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });
}