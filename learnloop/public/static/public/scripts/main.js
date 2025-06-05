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
});
