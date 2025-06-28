
import {getCookie} from "./utils.js";

export function setupColumnMenu() {
    const columnsContainer = document.querySelector('.columns-container');
    const columnMenu = document.getElementById('column-options-menu');

    // Se não houver container de colunas ou menu na página, não faz nada.
    if (!columnsContainer || !columnMenu) {
        return;
    }

    let currentColumn = null;

    // Usamos delegação de evento para ouvir cliques nos ícones "..."
   columnsContainer.addEventListener('click', (e) => {
    const optionsIcon = e.target.closest('.column-options-icon');
    if (optionsIcon) {
        e.stopPropagation();

        if (columnMenu.style.display === 'block') {
            columnMenu.style.display = 'none';
            return;
        }

        currentColumn = optionsIcon.closest('.board-column');
        const rect = optionsIcon.getBoundingClientRect();

        columnMenu.style.visibility = 'hidden';
        columnMenu.style.display = 'block';
        const menuWidth = columnMenu.offsetWidth;

        columnMenu.style.top = `${rect.bottom + 2}px`;
        columnMenu.style.left = `${rect.right - menuWidth}px`;
        columnMenu.style.visibility = 'visible';

        document.addEventListener('click', closeMenuOnClickOutside, true);
    }
});

    // Listener para a ação de deletar
    columnMenu.addEventListener('click', async (e) => {
        const deleteOption = e.target.closest('#delete-column-items-option');
        if (deleteOption && currentColumn) {
            const columnId = currentColumn.dataset.columnId;
            const columnName = currentColumn.querySelector('h3').textContent;

            if (confirm(`Tem certeza de que deseja deletar todos os itens da coluna "${columnName}"?`)) {
                try {
                    const response = await fetch(`/coluna/${columnId}/deletar-itens-ajax/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': getCookie('csrftoken'),
                            'Content-Type': 'application/json'
                        }
                    });
                    const result = await response.json();
                    if (result.status === 'success') {
                        alert(result.message);
                    } else {
                        throw new Error(result.message);
                    }
                } catch (error) {
                    alert(`Erro ao deletar itens da coluna: ${error.message}`);
                }
            }
            // Esconde o menu após a ação
            columnMenu.style.display = 'none';
        }
    });

    function closeMenuOnClickOutside(e) {
        if (!columnMenu.contains(e.target)) {
            columnMenu.style.display = 'none';
            document.removeEventListener('click', closeMenuOnClickOutside, true);
        }
    }
}