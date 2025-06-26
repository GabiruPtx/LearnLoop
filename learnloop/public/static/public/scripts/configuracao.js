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

    // --- Lógica para a aba de Avaliações ---
    const avaliacoesTab = document.querySelector('[data-tab="avaliacoes"]');
    if (avaliacoesTab) {
        avaliacoesTab.addEventListener('click', loadMilestonesForEvaluation);
        // Carrega os milestones se a aba já estiver ativa ao carregar a página
        if (avaliacoesTab.classList.contains('active')) {
            loadMilestonesForEvaluation();
        }
    }

    const editGradeModal = document.getElementById('edit-grade-modal');
    const editGradeForm = document.getElementById('edit-grade-form');
    const saveGradeBtn = document.getElementById('save-grade-btn');
    const saveProjectFeedbackBtn = document.getElementById('save-project-feedback-btn');
    let currentMilestoneIdForGrade = null;

    if (saveProjectFeedbackBtn) {
        saveProjectFeedbackBtn.addEventListener('click', saveProjectFeedback);
    }

    function loadMilestonesForEvaluation() {
        const listElement = document.getElementById('evaluation-milestone-list');
        if (!listElement) return;
        listElement.innerHTML = '<li>Carregando...</li>';

        fetch(window.MANAGE_MILESTONES_URL)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    renderEvaluationMilestones(data.milestones);
                } else {
                    listElement.innerHTML = '<li>Erro ao carregar milestones.</li>';
                }
            })
            .catch(error => {
                console.error('Erro ao buscar milestones para avaliação:', error);
                listElement.innerHTML = '<li>Erro de comunicação.</li>';
            });
    }

    function renderEvaluationMilestones(milestones) {
        const listElement = document.getElementById('evaluation-milestone-list');
        listElement.innerHTML = '';

        if (milestones.length === 0) {
            listElement.innerHTML = '<li class="access-list-item" style="justify-content: center; color: #777;">Nenhum milestone encontrado.</li>';
            return;
        }

        milestones.forEach(milestone => {
            const item = document.createElement('li');
            item.className = 'access-list-item';
            item.innerHTML = `
                <div class="user-info" style="flex-grow: 1;">
                    <span class="user-name">${milestone.nome}</span>
                    <span class="user-username">${milestone.descricao || 'Sem descrição'}</span>
                    <span class="user-username">Prazo: ${milestone.data_limite_formatted}</span>
                    <p class="milestone-feedback-display"><strong>Feedback:</strong> ${milestone.feedback || 'Nenhum'}</p>
                </div>
                <div class="milestone-grade-display">
                    <span>Nota: ${milestone.nota !== null ? milestone.nota : 'N/A'}</span>
                </div>
                <button class="btn btn-secondary-outline edit-grade-btn" data-id="${milestone.id}" data-name="${milestone.nome}" data-grade="${milestone.nota || ''}" data-feedback="${milestone.feedback || ''}">Avaliar</button>
            `;
            listElement.appendChild(item);
        });

        document.querySelectorAll('.edit-grade-btn').forEach(button => {
            button.addEventListener('click', openEditGradeModal);
        });
    }

    function openEditGradeModal(event) {
        currentMilestoneIdForGrade = event.target.dataset.id;
        const milestoneName = event.target.dataset.name;
        const currentGrade = event.target.dataset.grade;
        const currentFeedback = event.target.dataset.feedback;

        document.getElementById('milestone-name-for-grade').textContent = milestoneName;
        document.getElementById('milestone-grade-input').value = currentGrade;
        document.getElementById('milestone-feedback-input').value = currentFeedback;
        
        editGradeModal.style.display = 'flex';
    }

    if (editGradeForm) {
        editGradeForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const nota = document.getElementById('milestone-grade-input').value;
            const feedback = document.getElementById('milestone-feedback-input').value;

            fetch(`/projeto/${window.PROJECT_ID}/milestones-ajax/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({
                    action: 'update_grade',
                    id: currentMilestoneIdForGrade,
                    nota: nota,
                    feedback: feedback,
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert(data.message);
                    editGradeModal.style.display = 'none';
                    loadMilestonesForEvaluation(); // Recarrega a lista
                } else {
                    alert('Erro: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Erro ao salvar nota:', error);
                alert('Erro de comunicação.');
            });
        });
    }
    
    // Fechar modais
    document.querySelectorAll('.modal-overlay .close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-overlay').style.display = 'none';
        });
    });

    function saveProjectFeedback() {
        const feedback = document.getElementById('project-feedback-input').value;
        
        fetch(window.SAVE_PROJECT_FEEDBACK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({ feedback: feedback }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert(data.message);
            } else {
                alert('Erro: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro ao salvar feedback do projeto:', error);
            alert('Erro de comunicação.');
        });
    }
}