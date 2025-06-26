import { getCookie } from './utils.js';

export function setupPerfilPage() {
    const perfilContainer = document.querySelector('.perfil-container');
    if (!perfilContainer) {
        return;
    }

    const tabsContainer = document.getElementById('perfil-tabs');
    const tabPanes = document.querySelectorAll('.perfil-main-content .tab-pane');

    if (tabsContainer && tabPanes.length > 0) {
        const tabs = tabsContainer.querySelectorAll('.nav-link');
        tabs.forEach(tab => {
            tab.addEventListener('click', function(event) {
                event.preventDefault();
                tabs.forEach(t => t.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                this.classList.add('active');
                const targetId = this.getAttribute('data-tab');
                const targetPane = document.getElementById(targetId);
                if (targetPane) {
                    targetPane.classList.add('active');
                }

                // Se a aba de notas for selecionada, inicializa a lógica dela
                if (targetId === 'perfil-notas') {
                   setupNotasTab();
                }
            });
        });
    }

    const editProfileIcon = document.getElementById('edit-profile-icon');
    const profileForm = document.getElementById('profile-form');
    const saveProfileButton = document.getElementById('save-profile-button');
    const formInputs = profileForm.querySelectorAll('input');
    const passwordInput = document.getElementById('password');

    if (editProfileIcon) {
        editProfileIcon.addEventListener('click', () => {
            formInputs.forEach(input => {
                input.readOnly = false;
            });
            passwordInput.value = '';
            passwordInput.placeholder = 'Digite a nova senha (ou deixe em branco)';
            saveProfileButton.style.display = 'block';
            editProfileIcon.style.display = 'none';
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const formData = new FormData(profileForm);
            const data = Object.fromEntries(formData.entries());

            // Se a senha não foi alterada, não a envie
            if (!data.password) {
                delete data.password;
            }

            fetch('/perfil/update-ajax/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify(data),
            })
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success') {
                    alert(result.message); // Ou use um sistema de notificação mais elegante
                    
                    // Bloqueia os campos novamente
                    formInputs.forEach(input => {
                        input.readOnly = true;
                    });
                    passwordInput.value = '************';

                    // Esconde o botão de salvar e mostra o de editar
                    saveProfileButton.style.display = 'none';
                    editProfileIcon.style.display = 'block';
                } else {
                    alert('Erro: ' + result.message);
                }
            })
            .catch(error => {
                console.error('Erro ao salvar o perfil:', error);
                alert('Ocorreu um erro de comunicação. Tente novamente.');
            });
        });
    }

    // Lógica do Modal de Avatar
    const avatarContainer = document.getElementById('avatar-container');
    const avatarModal = document.getElementById('avatar-modal');
    const closeModal = document.querySelector('.close-avatar-modal');
    const avatarGrid = document.getElementById('avatar-grid');
    const saveAvatarButton = document.getElementById('save-avatar-button');
    let selectedAvatarPath = null;

    if (avatarContainer) {
        avatarContainer.addEventListener('click', () => {
            avatarModal.style.display = 'block';
            loadAvatars();
        });
    }

    if(closeModal) {
        closeModal.addEventListener('click', () => {
            avatarModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target == avatarModal) {
            avatarModal.style.display = 'none';
        }
    });

    function loadAvatars() {
        fetch('/perfil/get-avatars-ajax/')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    avatarGrid.innerHTML = '';
                    data.avatars.forEach(avatarPath => {
                        const img = document.createElement('img');
                        // O caminho para a tag `static` é relativo ao diretório `static`
                        img.src = `/static/${avatarPath}`;
                        img.style.width = '80px';
                        img.style.height = '80px';
                        img.style.cursor = 'pointer';
                        img.style.borderRadius = '50%';
                        img.style.border = '2px solid transparent';
                        img.dataset.path = avatarPath;

                        img.addEventListener('click', () => {
                            // Remove a seleção anterior
                            document.querySelectorAll('#avatar-grid img').forEach(i => i.style.borderColor = 'transparent');
                            // Adiciona seleção na imagem clicada
                            img.style.borderColor = '#007bff';
                            selectedAvatarPath = avatarPath;
                        });

                        avatarGrid.appendChild(img);
                    });
                }
            });
    }

    if (saveAvatarButton) {
        saveAvatarButton.addEventListener('click', () => {
            if (!selectedAvatarPath) {
                alert('Por favor, selecione um avatar.');
                return;
            }

            fetch('/perfil/update-ajax/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify({ avatar: selectedAvatarPath }),
            })
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success') {
                    // Atualiza a imagem do avatar na página
                    document.querySelector('#avatar-container img').src = `/static/${selectedAvatarPath}`;
                    avatarModal.style.display = 'none';
                    alert('Avatar atualizado com sucesso!');
                } else {
                    alert('Erro: ' + result.message);
                }
            })
            .catch(error => {
                console.error('Erro ao salvar o avatar:', error);
                alert('Ocorreu um erro de comunicação. Tente novamente.');
            });
        });
    }

   function setupNotasTab() {
       const listaProjetosContainer = document.getElementById('lista-projetos-container');
       const notasDetalhesContainer = document.getElementById('notas-detalhes-container');
       const projetoCards = document.querySelectorAll('.projeto-nota-card');
       const btnVoltar = document.getElementById('voltar-para-lista');

       if (!listaProjetosContainer || !notasDetalhesContainer) return;

       // Evento para cada card de projeto
       projetoCards.forEach(card => {
           card.addEventListener('click', function() {
               const projetoId = this.dataset.projectId;
               const projetoNome = this.querySelector('h4').textContent;
               
               fetch(`/perfil/projeto/${projetoId}/notas-ajax/`)
                   .then(response => response.json())
                   .then(data => {
                       if (data.status === 'success') {
                           document.getElementById('notas-projeto-titulo').textContent = `Notas de "${projetoNome}"`;
                           displayNotas(data);
                           
                           // Alterna a visibilidade
                           listaProjetosContainer.style.display = 'none';
                           notasDetalhesContainer.style.display = 'block';
                       } else {
                           alert('Erro: ' + data.message);
                       }
                   })
                   .catch(error => console.error('Erro na requisição:', error));
           });
       });

       // Evento para o botão de voltar
       if (btnVoltar) {
           btnVoltar.addEventListener('click', () => {
               notasDetalhesContainer.style.display = 'none';
               listaProjetosContainer.style.display = 'block';
           });
       }
   }

   function displayNotas(data) {
       // Exibe nota final e feedback
       document.querySelector('#nota-final-projeto .nota-valor').textContent = data.nota_final;
       document.querySelector('#feedback-final-projeto .feedback-texto').textContent = data.feedback_final;

       // Exibe notas dos milestones
       const milestonesList = document.getElementById('milestones-list');
       milestonesList.innerHTML = ''; // Limpa a lista anterior

       if (data.milestones && data.milestones.length > 0) {
           data.milestones.forEach(milestone => {
               const milestoneElement = document.createElement('div');
               milestoneElement.classList.add('milestone-item');
               milestoneElement.innerHTML = `
                   <h4>${milestone.nome}</h4>
                   <p><strong>Nota:</strong> <span class="nota-valor">${milestone.nota}</span></p>
                   <p><strong>Feedback:</strong> <span class="feedback-texto">${milestone.feedback}</span></p>
               `;
               milestonesList.appendChild(milestoneElement);
           });
       } else {
           milestonesList.innerHTML = '<p>Nenhum milestone avaliado para este projeto ainda.</p>';
       }
   }
}