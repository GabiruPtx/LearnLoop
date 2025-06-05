document.addEventListener('DOMContentLoaded', function() {
    // Código para alternar visibilidade de senhas
    const passwordInputs = document.querySelectorAll('.password-container input[type="password"]');
    const togglePasswordButtons = document.querySelectorAll('.password-container .toggle-password');

    togglePasswordButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            const passwordInput = passwordInputs[index];
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            const currentSrc = this.getAttribute('src');
            const newSrc = currentSrc.includes('Eye%20off.svg') ? eyeOpenSrc : eyeClosedSrc;
            this.setAttribute('src', newSrc);
        });
    });

    // --- Início do código JS para as abas ---
    const tabsMenu = document.getElementById('tabsMenu');
    console.log('tabsMenu encontrado:', tabsMenu); // Verifica se tabsMenu é encontrado

    if (tabsMenu) {
        const tabs = tabsMenu.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        console.log('Total de abas encontradas:', tabs.length); // Quantas abas encontrou
        console.log('Total de conteúdos de abas encontrados:', tabContents.length); // Quantos conteúdos encontrou

        tabs.forEach(tab => {
            console.log('Adicionando listener à aba:', tab); // Confirma que o listener está sendo adicionado
            tab.addEventListener('click', function() {
                console.log('Aba clicada:', this.dataset.tab); // Qual aba foi clicada

                // Remove a classe 'active' de todas as abas
                tabs.forEach(item => {
                    item.classList.remove('active');
                    console.log('Removido active de:', item);
                });
                // Adiciona a classe 'active' à aba clicada
                this.classList.add('active');
                console.log('Adicionado active a:', this);

                // Esconde todo o conteúdo das abas
                tabContents.forEach(content => {
                    content.classList.remove('active-content');
                    console.log('Removido active-content de:', content.id);
                });

                // Obtém o ID do conteúdo correspondente
                const targetTabId = this.dataset.tab;
                const targetContent = document.getElementById(`content-${targetTabId}`);
                console.log('Tentando mostrar conteúdo:', `content-${targetTabId}`, targetContent); // Vê se o conteúdo é encontrado

                // Mostra o conteúdo da aba clicada
                if (targetContent) {
                    targetContent.classList.add('active-content');
                    console.log('Conteúdo mostrado:', targetContent.id);
                } else {
                    console.warn(`Conteúdo com ID 'content-${targetTabId}' não encontrado.`);
                }
            });
        });
    } else {
        console.error('Elemento com ID "tabsMenu" não encontrado. O JS das abas não será inicializado.');
    }
    // --- Fim do código JS para as abas ---

    // Script para scroll horizontal com a roda do mouse (Mantenha o seu código existente)
    const columnsContainers = document.querySelectorAll('.columns-container');

    columnsContainers.forEach(container => {
        container.addEventListener('wheel', (event) => {
            event.preventDefault();
            container.scrollLeft += event.deltaY;
        });
    });

    // --- ELEMENTOS GLOBAIS PARA MENUS E MODAIS ---
    const overlay = document.getElementById('overlay');

    // --- CÓDIGO PARA O MENU DO PROJETO ---
    const moreOptionsIcon = document.querySelector('.more-options-icon');
    const projectMenu = document.getElementById('project-menu');

   // --- CÓDIGO PARA O MODAL "ADICIONAR MEMBROS" ---
    const addMembersOption = document.getElementById('addMembersOption');
    const addMembersModal = document.getElementById('addMembersModal');
    const closeAddMembersModalButton = document.getElementById('closeAddMembersModal');
    const confirmAddMemberButton = document.getElementById('confirmAddMemberButton'); // Se já existia, ótimo. Senão, defina.
    const memberSearchInput = document.getElementById('memberSearchInput'); // ADICIONADO/CONFIRMADO
    const addMemberModalMessage = document.getElementById('addMemberModalMessage'); // ADICIONADO/CONFIRMADO
    // const confirmAddMemberButton = document.getElementById('confirmAddMemberButton'); // Para uso futuro


    // --- FUNÇÕES DE CONTROLE DE VISIBILIDADE ---

    function openProjectMenu() {
        if (!projectMenu || projectMenu.classList.contains('active')) return;

        // Lógica de posicionamento do menu do projeto (conforme ajuste anterior)
        projectMenu.style.visibility = 'hidden';
        projectMenu.style.display = 'block';
        const iconRect = moreOptionsIcon.getBoundingClientRect();
        projectMenu.style.top = `${iconRect.bottom + 5}px`;
        const menuWidth = projectMenu.offsetWidth;
        const viewportWidth = window.innerWidth;
        const safetyMargin = 20;
        let menuLeft = iconRect.right - menuWidth;
        if (menuLeft < safetyMargin) menuLeft = safetyMargin;
        if (menuLeft + menuWidth > viewportWidth - safetyMargin) {
            menuLeft = viewportWidth - menuWidth - safetyMargin;
        }
        projectMenu.style.left = `${menuLeft}px`;
        projectMenu.style.right = 'auto';
        
        projectMenu.classList.add('active');
        projectMenu.style.visibility = ''; // Reverte para CSS
        if (overlay) overlay.classList.add('active');
        setTimeout(() => document.addEventListener('click', handleDocumentClickForProjectMenu), 0);
    }

    function closeProjectMenu() {
        if (!projectMenu || !projectMenu.classList.contains('active')) return;
        projectMenu.classList.remove('active');
        document.removeEventListener('click', handleDocumentClickForProjectMenu);
        // Só esconde o overlay se o modal de adicionar membros também não estiver ativo
        if (overlay && (!addMembersModal || !addMembersModal.classList.contains('active'))) {
            overlay.classList.remove('active');
        }
    }
    
    function handleDocumentClickForProjectMenu(event) {
        // Fecha o menu do projeto se o clique for fora dele e fora do ícone que o abre
        if (projectMenu && !projectMenu.contains(event.target) && 
            moreOptionsIcon && !moreOptionsIcon.contains(event.target)) {
            closeProjectMenu();
        }
    }

    function openAddMembersModal() {
        if (!addMembersModal || addMembersModal.classList.contains('active')) return;
        
        closeProjectMenu();

        if (memberSearchInput) memberSearchInput.value = ''; // Limpa o input
        if (addMemberModalMessage) {
            addMemberModalMessage.textContent = ''; // Limpa mensagens anteriores
            addMemberModalMessage.style.color = ''; // Reseta a cor
        }
        if (confirmAddMemberButton) confirmAddMemberButton.disabled = false; // Garante que o botão esteja habilitado

        addMembersModal.classList.add('active');
        if (overlay) overlay.classList.add('active');
    }
    if (confirmAddMemberButton && memberSearchInput && addMembersModal && addMemberModalMessage) {
        confirmAddMemberButton.addEventListener('click', function() {
            const matriculaAluno = memberSearchInput.value.trim();
            const urlParams = new URLSearchParams(window.location.search);
            const projetoId = urlParams.get('projeto_id');

            addMemberModalMessage.textContent = ''; // Limpa mensagens anteriores

            if (!matriculaAluno) {
                addMemberModalMessage.textContent = 'Por favor, digite a matrícula do aluno.';
                addMemberModalMessage.style.color = 'red';
                return;
            }

            if (!projetoId) {
                addMemberModalMessage.textContent = 'ID do projeto não identificado. Por favor, selecione um projeto.';
                addMemberModalMessage.style.color = 'red';
                // Opcional: fechar o modal e alertar o usuário para selecionar um projeto
                // closeAddMembersModal();
                // alert('Por favor, selecione um projeto antes de adicionar membros.');
                return;
            }

            confirmAddMemberButton.disabled = true;
            addMemberModalMessage.textContent = 'Adicionando membro...';
            addMemberModalMessage.style.color = 'blue';

            const csrftoken = getCookie('csrftoken'); // Função já existente para pegar o CSRF token

            if (typeof addMemberAjaxUrl === 'undefined') {
                console.error('A variável global addMemberAjaxUrl não está definida.');
                addMemberModalMessage.textContent = 'Erro de configuração: URL para adicionar membro não encontrada.';
                addMemberModalMessage.style.color = 'red';
                confirmAddMemberButton.disabled = false;
                return;
            }

            const formData = new FormData();
            formData.append('matricula_aluno', matriculaAluno);
            formData.append('projeto_id', projetoId);

            fetch(addMemberAjaxUrl, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrftoken
                    // Content-Type é automaticamente definido para multipart/form-data com FormData
                },
                body: formData
            })
            .then(response => {
                // Tenta obter o JSON independentemente do status para poder ler a mensagem de erro do backend
                return response.json().then(data => ({ status: response.status, ok: response.ok, body: data }));
            })
            .then(result => {
                const data = result.body;
                if (result.ok && data.status === 'success') {
                    addMemberModalMessage.textContent = data.message;
                    addMemberModalMessage.style.color = 'green';
                    memberSearchInput.value = ''; // Limpa o input
                    setTimeout(() => {
                        closeAddMembersModal();
                        window.location.reload(); // Recarrega para refletir a mudança
                    }, 2000); // Fecha e recarrega após 2 segundos
                } else {
                    // Se o backend retornou um erro JSON com uma mensagem
                    addMemberModalMessage.textContent = data.message || `Erro ${result.status}: Não foi possível adicionar o membro.`;
                    addMemberModalMessage.style.color = 'red';
                    confirmAddMemberButton.disabled = false;
                }
            })
            .catch(error => {
                console.error('Erro na requisição AJAX para adicionar membro:', error);
                addMemberModalMessage.textContent = 'Ocorreu um erro de comunicação ao tentar adicionar o membro.';
                addMemberModalMessage.style.color = 'red';
                confirmAddMemberButton.disabled = false;
            });
        });
    } else {
        // Logs para ajudar a depurar se algum elemento essencial não for encontrado
        if (!confirmAddMemberButton) console.warn("Botão 'confirmAddMemberButton' não encontrado no DOM.");
        if (!memberSearchInput) console.warn("Input 'memberSearchInput' não encontrado no DOM.");
        if (!addMemberModalMessage) console.warn("Elemento 'addMemberModalMessage' não encontrado no DOM.");
        // addMembersModal já é verificado em outros lugares.
    }

    function closeAddMembersModal() {
        if (!addMembersModal || !addMembersModal.classList.contains('active')) return;
        addMembersModal.classList.remove('active');
        // Só esconde o overlay se o menu do projeto também não estiver ativo
        if (overlay && (!projectMenu || !projectMenu.classList.contains('active'))) {
            overlay.classList.remove('active');
        }
    }

    // --- EVENT LISTENERS ---

    // Listener para o ícone de mais opções (abrir/fechar menu do projeto)
    if (moreOptionsIcon && projectMenu) {
        moreOptionsIcon.addEventListener('click', (event) => {
            event.stopPropagation(); // Impede que o clique feche o menu imediatamente
            if (projectMenu.classList.contains('active')) {
                closeProjectMenu();
            } else {
                openProjectMenu();
            }
        });
    }

    // Impede que cliques dentro do menu do projeto o fechem (a menos que seja em um item específico)
    if (projectMenu) {
        projectMenu.addEventListener('click', (event) => event.stopPropagation());

        // Listeners para itens do menu do projeto
        projectMenu.querySelectorAll('.menu-item').forEach(item => {
            // Se o item NÃO for o de "Adicionar Membros", ele fecha o menu normalmente
            if (item.id !== 'addMembersOption') {
                item.addEventListener('click', () => {
                    // console.log('Item do menu (não Adicionar Membros) clicado:', item.textContent.trim());
                    closeProjectMenu();
                });
            }
        });
    }
    
    // Listener para a opção "Adicionar Membros"
    if (addMembersOption) {
        addMembersOption.addEventListener('click', (event) => {
            event.stopPropagation(); // Impede que o clique seja tratado pelo listener geral de itens do menu
            // console.log('Opção Adicionar Membros clicada');
            openAddMembersModal();
        });
    }

    // Listener para o botão de fechar do modal "Adicionar Membros"
    if (closeAddMembersModalButton) {
        closeAddMembersModalButton.addEventListener('click', () => {
            closeAddMembersModal();
        });
    }
    
    // Impede que cliques dentro do conteúdo do modal "Adicionar Membros" o fechem via overlay
    if (addMembersModal) {
        addMembersModal.addEventListener('click', (event) => event.stopPropagation());
    }

    // Listener para o overlay (fechar o que estiver ativo)
    if (overlay) {
        overlay.addEventListener('click', () => {
            // console.log('Overlay clicado');
            if (addMembersModal && addMembersModal.classList.contains('active')) {
                closeAddMembersModal();
            } else if (projectMenu && projectMenu.classList.contains('active')) {
                closeProjectMenu(); // O listener de clique no documento já deve cuidar disso, mas como fallback.
            }
        });
    }

    // --- Inicialização ou outros códigos ---
    // Se houver elementos para o menu do projeto não encontrados, exibir aviso (existente)
    if (!moreOptionsIcon || !projectMenu || !overlay) {
        // console.warn("Elementos para o menu do projeto não encontrados.");
    }
    if (!addMembersOption || !addMembersModal || !closeAddMembersModalButton) {
        // console.warn("Elementos para o modal Adicionar Membros não encontrados.");
    }
    // --- FIM DO NOVO CÓDIGO PARA O MENU DO PROJETO ---

    // código para o modal de Adicionar Projeto
    const addProjectModal = document.getElementById('addProjectModal');
    const showAddProjectModalButton = document.getElementById('showAddProjectModalButton');
    const closeAddProjectModalButton = document.getElementById('closeAddProjectModalButton');
    const confirmCreateProjectButtonModal = document.getElementById('confirmCreateProjectButtonModal');
    const projectNameInputModal = document.getElementById('projectNameInputModal');
    const modalErrorMessage = document.getElementById('modalErrorMessage');

    if (showAddProjectModalButton && addProjectModal && projectNameInputModal && modalErrorMessage) {
        showAddProjectModalButton.addEventListener('click', function(event) {
            event.preventDefault();
            projectNameInputModal.value = '';
            modalErrorMessage.textContent = '';
            if(confirmCreateProjectButtonModal) confirmCreateProjectButtonModal.disabled = false; // Garante que o botão está habilitado ao abrir
            addProjectModal.style.display = 'flex';
        });
    }

    if (closeAddProjectModalButton && addProjectModal) {
        closeAddProjectModalButton.addEventListener('click', function() {
            addProjectModal.style.display = 'none';
        });
    }

    if (addProjectModal) {
        window.addEventListener('click', function(event) {
            if (event.target == addProjectModal) {
                addProjectModal.style.display = 'none';
            }
        });
    }

    if (confirmCreateProjectButtonModal && projectNameInputModal && modalErrorMessage && addProjectModal) {
        console.log('Anexando listener ao botão confirmCreateProjectButtonModal.'); // Deve aparecer uma vez no console

        confirmCreateProjectButtonModal.addEventListener('click', function() {
            console.log('Botão confirmCreateProjectButtonModal clicado.'); // Se aparecer >1 vez por clique, há múltiplos listeners

            // Desabilita o botão para prevenir múltiplos cliques
            confirmCreateProjectButtonModal.disabled = true;
            modalErrorMessage.textContent = 'Criando projeto...'; // Feedback visual

            const projectName = projectNameInputModal.value.trim();
            if (!projectName) {
                modalErrorMessage.textContent = 'O nome do projeto não pode estar vazio.';
                confirmCreateProjectButtonModal.disabled = false; // Reabilita se o nome estiver vazio
                return;
            }

            function getCookie(name) {
                let cookieValue = null;
                if (document.cookie && document.cookie !== '') {
                    const cookies = document.cookie.split(';');
                    for (let i = 0; i < cookies.length; i++) {
                        const cookie = cookies[i].trim();
                        if (cookie.substring(0, name.length + 1) === (name + '=')) {
                            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                            break;
                        }
                    }
                }
                return cookieValue;
            }
            const csrftoken = getCookie('csrftoken');

            // Certifique-se que 'createProjectAjaxUrl' está definida globalmente no HTML
            if (typeof createProjectAjaxUrl === 'undefined') {
                console.error('A variável createProjectAjaxUrl não está definida.');
                modalErrorMessage.textContent = 'Erro de configuração: URL não encontrada.';
                confirmCreateProjectButtonModal.disabled = false; // Reabilita
                return;
            }

            fetch(createProjectAjaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrftoken
                },
                body: `project_name=${encodeURIComponent(projectName)}`
            })
            .then(response => {
                if (!response.ok) { // Verifica se a resposta HTTP foi bem-sucedida
                    // Tenta ler o corpo do erro como JSON, se possível
                    return response.json().then(errData => {
                        throw errData; // Lança o objeto de erro para ser pego pelo .catch
                    }).catch(() => {
                        // Se o corpo do erro não for JSON, lança um erro genérico
                        throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    addProjectModal.style.display = 'none';
                    window.location.reload();
                    // O botão permanecerá desabilitado, pois a página será recarregada
                } else {
                    modalErrorMessage.textContent = data.message || 'Erro ao criar o projeto.';
                    confirmCreateProjectButtonModal.disabled = false; // Reabilita em caso de erro da aplicação
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                // Se o erro for um objeto (como lançado pelo then anterior), use a mensagem dele
                if (error && error.message) {
                    modalErrorMessage.textContent = error.message;
                } else {
                    modalErrorMessage.textContent = 'Ocorreu um erro de comunicação. Tente novamente.';
                }
                confirmCreateProjectButtonModal.disabled = false; // Reabilita em caso de erro na comunicação/fetch
            });
        });
    } else {
        // Log se algum dos elementos do modal não for encontrado, o que impediria o listener de ser anexado.
        if (!confirmCreateProjectButtonModal) console.error('Botão confirmCreateProjectButtonModal não encontrado.');
        if (!projectNameInputModal) console.error('Input projectNameInputModal não encontrado.');
        if (!modalErrorMessage) console.error('Elemento modalErrorMessage não encontrado.');
        if (!addProjectModal) console.error('Modal addProjectModal não encontrado.');
    }


    const addTaskModal = document.getElementById('addTaskModal');
    const closeAddTaskModalButton = document.getElementById('closeAddTaskModalButton');
    const taskTitleInputModal = document.getElementById('taskTitleInputModal');
    const taskDescriptionInputModal = document.getElementById('taskDescriptionInputModal');
    const taskModalErrorMessage = document.getElementById('taskModalErrorMessage');
    const selectedProjectIdForTaskInput = document.getElementById('selectedProjectIdForTask');

    // Função auxiliar para obter o cookie CSRF
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Função para configurar e abrir o modal de adicionar tarefa
    function openAddTaskModalWithInitialStatus(initialStatusValue) {
        const urlParams = new URLSearchParams(window.location.search);
        const selectedProjectId = urlParams.get('projeto_id');

        if (!selectedProjectId) {
            alert('Por favor, selecione um projeto antes de adicionar uma tarefa.');
            return;
        }

        taskTitleInputModal.value = '';
        taskDescriptionInputModal.value = '';
        taskModalErrorMessage.textContent = '';
        selectedProjectIdForTaskInput.value = selectedProjectId;

        // Importante: Obter o botão de confirmação AQUI, após o modal estar no DOM
        // e potencialmente recriado se você usar a técnica de clonagem para limpar listeners.
        // Para simplificar, vamos buscar o botão sempre que a função for chamada
        // e garantir que o listener seja adicionado uma única vez por "sessão" de abertura do modal.
        let confirmCreateTaskButtonModal = document.getElementById('confirmCreateTaskButtonModal');

        // Se o botão já tiver um listener de um clique anterior, removemos.
        // Uma forma é clonar o botão para remover todos os listeners:
        const newConfirmButton = confirmCreateTaskButtonModal.cloneNode(true);
        confirmCreateTaskButtonModal.parentNode.replaceChild(newConfirmButton, confirmCreateTaskButtonModal);
        confirmCreateTaskButtonModal = newConfirmButton; // Usar o novo botão a partir de agora

        confirmCreateTaskButtonModal.disabled = false;
        addTaskModal.style.display = 'flex';

        confirmCreateTaskButtonModal.addEventListener('click', function handleConfirmCreation() {
            confirmCreateTaskButtonModal.disabled = true;
            taskModalErrorMessage.textContent = 'Criando tarefa...';

            const taskTitle = taskTitleInputModal.value.trim();
            const taskDescription = taskDescriptionInputModal.value.trim();
            const projectId = selectedProjectIdForTaskInput.value;

            if (!taskTitle) {
                taskModalErrorMessage.textContent = 'O título da tarefa não pode estar vazio.';
                confirmCreateTaskButtonModal.disabled = false;
                return;
            }
            if (!projectId) {
                taskModalErrorMessage.textContent = 'ID do projeto não encontrado.';
                confirmCreateTaskButtonModal.disabled = false;
                return;
            }

            const csrftoken = getCookie('csrftoken');
            if (typeof createTaskAjaxUrl === 'undefined') {
                taskModalErrorMessage.textContent = 'Erro de configuração: URL de criação de tarefa não definida.';
                confirmCreateTaskButtonModal.disabled = false;
                return;
            }

            const body = new URLSearchParams({
                'task_title': taskTitle,
                'task_description': taskDescription,
                'project_id': projectId,
                'initial_status': initialStatusValue // Passa o status inicial desejado
            });

            fetch(createTaskAjaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrftoken
                },
                body: body.toString()
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => { throw errData; })
                                     .catch(() => { throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`); });
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    addTaskModal.style.display = 'none';
                    window.location.reload(); // Recarrega para ver a nova tarefa
                } else {
                    taskModalErrorMessage.textContent = data.message || 'Erro ao criar a tarefa.';
                    confirmCreateTaskButtonModal.disabled = false;
                }
            })
            .catch(error => {
                console.error('Erro na requisição de criar tarefa:', error);
                taskModalErrorMessage.textContent = (error && error.message) ? error.message : 'Ocorreu um erro de comunicação.';
                confirmCreateTaskButtonModal.disabled = false;
            });
        }, { once: true }); // { once: true } garante que este listener específico só dispare uma vez.
    }

    // Listeners para os botões "Adicionar Task"
    const btnAddTaskBacklog = document.getElementById('showAddTaskModalButtonBacklog');
    if (btnAddTaskBacklog) {
        btnAddTaskBacklog.addEventListener('click', function(event) {
            event.preventDefault();
            openAddTaskModalWithInitialStatus('PENDENTE'); // Tarefas do backlog são PENDENTE
        });
    }

    const btnAddTaskToDo = document.getElementById('showAddTaskModalButtonTodo');
    if (btnAddTaskToDo) {
        btnAddTaskToDo.addEventListener('click', function(event) {
            event.preventDefault();
            openAddTaskModalWithInitialStatus('PENDENTE'); // Tarefas "ToDo" são PENDENTE
        });
    }

    const btnAddTaskInProgress = document.getElementById('showAddTaskModalButtonInProgress');
    if (btnAddTaskInProgress) {
        btnAddTaskInProgress.addEventListener('click', function(event) {
            event.preventDefault();
            openAddTaskModalWithInitialStatus('EM_ANDAMENTO'); // Tarefas "In Progress" são EM_ANDAMENTO
        });
    }

    const btnAddTaskComplete = document.getElementById('showAddTaskModalButtonComplete');
    if (btnAddTaskComplete) {
        btnAddTaskComplete.addEventListener('click', function(event) {
            event.preventDefault();
            // Geralmente não se adiciona tarefas já concluídas, mas se for o caso:
            openAddTaskModalWithInitialStatus('CONCLUIDA'); // Tarefas "Complete" são CONCLUIDA
        });
    }

    // Fechamento do Modal de Tarefa
    if (closeAddTaskModalButton && addTaskModal) {
        closeAddTaskModalButton.addEventListener('click', function() {
            addTaskModal.style.display = 'none';
        });
    }
    if (addTaskModal) {
        window.addEventListener('click', function(event) {
            if (event.target === addTaskModal) {
                addTaskModal.style.display = 'none';
            }
        });
    }
});