// learnloop/public/static/public/scripts/projectInfoSidebar.js

export function setupProjectInfoSidebar() {
    const toggleBtn = document.getElementById('toggleProjectInfoSidebarBtn');
    const sidebar = document.getElementById('projectInfoSidebar');
    const overlay = document.getElementById('project-info-overlay');
    const closeBtn = document.getElementById('closeProjectInfoSidebarBtn');

    if (!toggleBtn || !sidebar || !overlay || !closeBtn) {
        return;
    }

    const openSidebar = async () => {
        if (typeof getProjectDetailsAjaxUrl === 'undefined' || !getProjectDetailsAjaxUrl) {
            console.error("URL de detalhes do projeto não está definida.");
            return;
        }

        sidebar.classList.add('visible');
        overlay.classList.add('visible');

        try {
            const response = await fetch(getProjectDetailsAjaxUrl);
            const data = await response.json();

            if (data.status === 'success') {
                populateSidebar(data.details);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            document.getElementById('info-sidebar-descricao').textContent = `Erro ao carregar: ${error.message}`;
        }
    };

    const closeSidebar = () => {
        sidebar.classList.remove('visible');
        overlay.classList.remove('visible');
        resetSidebar(); // Limpa os dados ao fechar
    };

    const populateSidebar = (details) => {
        document.getElementById('info-sidebar-descricao').textContent = details.descricao;
        document.getElementById('info-sidebar-readme').innerHTML = details.readme_html;
        document.getElementById('info-sidebar-status').textContent = details.status;
        document.getElementById('info-sidebar-data-inicio').textContent = details.data_inicio;
        document.getElementById('info-sidebar-data-limite').textContent = details.data_limite;
    };

    const resetSidebar = () => {
        document.getElementById('info-sidebar-descricao').textContent = 'Carregando...';
        document.getElementById('info-sidebar-readme').innerHTML = 'Carregando...';
        document.getElementById('info-sidebar-status').textContent = 'Carregando...';
        document.getElementById('info-sidebar-data-inicio').textContent = '--/--/----';
        document.getElementById('info-sidebar-data-limite').textContent = '--/--/----';
    };

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sidebar.classList.contains('visible')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
}