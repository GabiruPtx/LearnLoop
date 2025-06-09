import { getCookie } from './utils.js';

export function setupConfiguracaoPage() {
    const configContainer = document.querySelector('.config-container');
    // Só executa se estivermos na página de configuração
    if (!configContainer) {
        return;
    }

    console.log("Página de Configuração detectada. Iniciando scripts...");

    // Inicializa o editor EasyMDE
    let easyMDE;
    const readmeEditor = document.getElementById('readmeEditor');
    if (readmeEditor) {
        try {
            console.log("Tentando inicializar o editor EasyMDE...");
            easyMDE = new EasyMDE({
                element: readmeEditor,
                initialValue: readmeEditor.value,
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

    // Submissão assíncrona do formulário de configuração
    const configForm = document.getElementById('configProjectForm');
    if(configForm) {
        configForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const saveButton = document.getElementById('saveChangesButton');
            const saveStatus = document.getElementById('saveStatus');

            saveButton.disabled = true;
            //saveButton.textContent = 'Salvando...';
            saveStatus.style.display = 'none';

            const formData = new FormData();
            formData.append('nome', document.getElementById('projectName').value);
            formData.append('descricao', document.getElementById('projectDescription').value);
            if (easyMDE) {
                formData.append('readme', easyMDE.value());
            } else {
                formData.append('readme', document.getElementById('readmeEditor').value);
            }

            fetch(saveConfigAjaxUrl, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: new URLSearchParams(formData)
            })
            .then(response => response.json())
            .then(data => {
                if(data.status === 'success') {
                    saveStatus.textContent = 'Salvo!';
                    saveStatus.style.color = 'green';
                    saveStatus.style.display = 'inline';
                    setTimeout(() => {
                        saveStatus.style.display = 'none';
                    }, 5000);
                } else {
                    saveStatus.textContent = data.message || 'Erro ao salvar.';
                    saveStatus.style.color = 'red';
                    saveStatus.style.display = 'inline';
                }
            })
            .catch(error => {
                console.error('Erro no fetch:', error);
                saveStatus.textContent = 'Erro de comunicação.';
                saveStatus.style.color = 'red';
                saveStatus.style.display = 'inline';
            })
            .finally(() => {
                saveButton.disabled = false;
            });
        });
    }
}