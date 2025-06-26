import { getCookie } from './utils.js';

export function setupProjectSettings() {
    // Só executa se os botões existirem na página
    const closeProjectBtn = document.getElementById('closeProjectBtn');
    const deleteProjectBtn = document.getElementById('deleteProjectBtn');

    if (!closeProjectBtn || !deleteProjectBtn) {
        return;
    }

    // Elementos do Modal de Fechar
    const closeProjectModal = document.getElementById('closeProjectModal');
    const confirmCloseProjectBtn = document.getElementById('confirmCloseProjectBtn');
    const cancelCloseProjectBtn = document.getElementById('cancelCloseProjectBtn');
    const closeCloseModalBtn = closeProjectModal.querySelector('.close-modal-btn');

    // Elementos do Modal de Deletar
    const deleteProjectModal = document.getElementById('deleteProjectModal');
    const confirmDeleteProjectBtn = document.getElementById('confirmDeleteProjectBtn');
    const cancelDeleteProjectBtn = document.getElementById('cancelDeleteProjectBtn');
    const closeDeleteModalBtn = deleteProjectModal.querySelector('.close-modal-btn');


    // Função genérica para abrir modal
    function openModal(modal) {
        modal.classList.add('visible');
    }

    // Função genérica para fechar modal
    function closeModal(modal) {
        modal.classList.remove('visible');
    }

    // Função para realizar a ação (fechar ou deletar)
    function performAction(url, successMessage) {
        fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert(successMessage);
                window.location.href = data.redirect_url;
            } else {
                alert('Erro: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            alert('Ocorreu um erro de comunicação.');
        });
    }

    // --- Event Listeners ---

    // Abrir modais
    closeProjectBtn.addEventListener('click', () => openModal(closeProjectModal));
    deleteProjectBtn.addEventListener('click', () => openModal(deleteProjectModal));

    // Fechar modais pelos botões de cancelar/fechar
    cancelCloseProjectBtn.addEventListener('click', () => closeModal(closeProjectModal));
    closeCloseModalBtn.addEventListener('click', () => closeModal(closeProjectModal));

    cancelDeleteProjectBtn.addEventListener('click', () => closeModal(deleteProjectModal));
    closeDeleteModalBtn.addEventListener('click', () => closeModal(deleteProjectModal));

    // Confirmar ações
    confirmCloseProjectBtn.addEventListener('click', () => {
        performAction(closeProjectAjaxUrl, 'Projeto fechado com sucesso!');
    });

    confirmDeleteProjectBtn.addEventListener('click', () => {
        performAction(deleteProjectAjaxUrl, 'Projeto deletado com sucesso.');
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target === closeProjectModal) {
            closeModal(closeProjectModal);
        }
        if (event.target === deleteProjectModal) {
            closeModal(deleteProjectModal);
        }
    });
}