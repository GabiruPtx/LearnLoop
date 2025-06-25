export function setupPerfilPage() {
    const perfilContainer = document.querySelector('.perfil-container');
    // Só executa se estivermos na página de perfil
    if (!perfilContainer) {
        return;
    }

    const tabsContainer = document.getElementById('perfil-tabs');
    const tabPanes = document.querySelectorAll('.perfil-main-content .tab-pane');

    if (tabsContainer && tabPanes.length > 0) {
        const tabs = tabsContainer.querySelectorAll('.nav-link');

        tabs.forEach(tab => {
            tab.addEventListener('click', function(event) {
                event.preventDefault(); // Previne o comportamento padrão do link

                // Remove a classe 'active' de todas as abas e painéis
                tabs.forEach(t => t.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));

                // Adiciona a classe 'active' à aba clicada
                this.classList.add('active');

                // Mostra o painel de conteúdo correspondente
                const targetId = this.getAttribute('data-tab');
                const targetPane = document.getElementById(targetId);
                if (targetPane) {
                    targetPane.classList.add('active');
                }
            });
        });
    }
}