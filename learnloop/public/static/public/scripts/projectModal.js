export function setupProjectModal() {
  const addProjectModal = document.getElementById('addProjectModal');
  const showAddProjectModalButton = document.getElementById('showAddProjectModalButton');
  const closeAddProjectModalButton = document.getElementById('closeAddProjectModalButton');
  const confirmCreateProjectButtonModal = document.getElementById('confirmCreateProjectButtonModal');
  const projectNameInputModal = document.getElementById('projectNameInputModal');
  const modalErrorMessage = document.getElementById('modalErrorMessage');

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  if (showAddProjectModalButton && addProjectModal && projectNameInputModal && modalErrorMessage) {
    showAddProjectModalButton.addEventListener('click', event => {
      event.preventDefault();
      projectNameInputModal.value = '';
      modalErrorMessage.textContent = '';
      if (confirmCreateProjectButtonModal) confirmCreateProjectButtonModal.disabled = false;
      addProjectModal.style.display = 'flex';
    });
  }

  if (closeAddProjectModalButton && addProjectModal) {
    closeAddProjectModalButton.addEventListener('click', () => {
      addProjectModal.style.display = 'none';
    });
  }

  if (addProjectModal) {
    window.addEventListener('click', event => {
      if (event.target === addProjectModal) {
        addProjectModal.style.display = 'none';
      }
    });
  }

  if (confirmCreateProjectButtonModal && projectNameInputModal && modalErrorMessage && addProjectModal) {
    confirmCreateProjectButtonModal.addEventListener('click', () => {
      confirmCreateProjectButtonModal.disabled = true;
      modalErrorMessage.textContent = 'Criando projeto...';

      const projectName = projectNameInputModal.value.trim();
      if (!projectName) {
        modalErrorMessage.textContent = 'O nome do projeto não pode estar vazio.';
        confirmCreateProjectButtonModal.disabled = false;
        return;
      }

      const csrftoken = getCookie('csrftoken');

      if (typeof createProjectAjaxUrl === 'undefined') {
        console.error('A variável createProjectAjaxUrl não está definida.');
        modalErrorMessage.textContent = 'Erro de configuração: URL não encontrada.';
        confirmCreateProjectButtonModal.disabled = false;
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
          if (!response.ok) {
            return response.json().then(errData => { throw errData; })
                             .catch(() => { throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`); });
          }
          return response.json();
        })
        .then(data => {
          if (data.status === 'success') {
            addProjectModal.style.display = 'none';
            window.location.reload();
          } else {
            modalErrorMessage.textContent = data.message || 'Erro ao criar o projeto.';
            confirmCreateProjectButtonModal.disabled = false;
          }
        })
        .catch(error => {
          console.error('Erro na requisição:', error);
          modalErrorMessage.textContent = error.message || 'Erro de comunicação.';
          confirmCreateProjectButtonModal.disabled = false;
        });
    });
  }
}
