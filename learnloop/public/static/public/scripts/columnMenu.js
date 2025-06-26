// learnloop/public/static/public/scripts/columnMenu.js

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
    columnMenu.addEventListener('click', (e) => {
        const deleteOption = e.target.closest('#delete-column-items-option');
        if (deleteOption && currentColumn) {
            const columnId = currentColumn.dataset.columnId;
            const columnName = currentColumn.querySelector('h3').textContent;

            // Ação a ser executada. Por enquanto, um alerta.
            alert(`Funcionalidade para deletar itens da coluna "${columnName}" (ID: ${columnId}) a ser implementada.`);

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