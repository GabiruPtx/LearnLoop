export function setupConfiguracaoPage() {
    const configContainer = document.querySelector('.config-container');
    // Só executa se estivermos na página de configuração
    if (!configContainer) {
        return;
    }

    console.log("Página de Configuração detectada. Iniciando scripts...");

    // Inicializa o editor EasyMDE
    const readmeEditor = document.getElementById('readmeEditor');
    if (readmeEditor) {
        try {
            console.log("Tentando inicializar o editor EasyMDE...");
            new EasyMDE({
                element: readmeEditor,
                spellChecker: false,
                placeholder: "Escreva o README do seu projeto aqui...",
            });
            console.log("Editor EasyMDE inicializado com sucesso.");
        } catch (e) {
            console.error("ERRO: Falha ao iniciar o editor EasyMDE. Verifique se a biblioteca está carregada no HTML.", e);
        }
    } else {
        console.warn("Aviso: Elemento com id 'readmeEditor' não encontrado.");
    }


    // Funcionalidade das abas
    const configTabsContainer = document.getElementById('config-tabs');
    const tabPanes = document.querySelectorAll('.config-content .tab-pane');

    if (configTabsContainer && tabPanes.length > 0) {
        const tabs = configTabsContainer.querySelectorAll('.nav-link');

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
        console.log("Funcionalidade das abas configurada.");
    } else {
        console.warn("Aviso: Elementos para as abas de configuração não encontrados.");
    }
}