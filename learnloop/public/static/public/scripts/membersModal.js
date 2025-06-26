import { getCookie } from './utils.js';

export function setupMembersModal() {
  const addMembersOption = document.getElementById('addMembersOption');
  const addMembersModal = document.getElementById('addMembersModal');
  const closeAddMembersModalButton = document.getElementById('closeAddMembersModal');
  const confirmAddMemberButton = document.getElementById('confirmAddMemberButton');
  const memberSearchInput = document.getElementById('memberSearchInput');
  const addMemberModalMessage = document.getElementById('addMemberModalMessage');
  const overlay = document.getElementById('overlay');

  function closeAddMembersModal() {
    if (!addMembersModal || !addMembersModal.classList.contains('active')) return;
    addMembersModal.classList.remove('active');
    if (overlay && (!document.getElementById('project-menu')?.classList.contains('active'))) {
      overlay.classList.remove('active');
    }
  }

  function openAddMembersModal() {
    if (!addMembersModal || addMembersModal.classList.contains('active')) return;

    document.getElementById('project-menu')?.classList.remove('active');
    if (memberSearchInput) memberSearchInput.value = '';
    if (addMemberModalMessage) {
      addMemberModalMessage.textContent = '';
      addMemberModalMessage.style.color = '';
    }
    if (confirmAddMemberButton) confirmAddMemberButton.disabled = false;

    addMembersModal.classList.add('active');
    if (overlay) overlay.classList.add('active');
  }

  if (confirmAddMemberButton && memberSearchInput && addMembersModal && addMemberModalMessage) {
    confirmAddMemberButton.addEventListener('click', () => {
      const matriculaAluno = memberSearchInput.value.trim();
      const projetoId = new URLSearchParams(window.location.search).get('projeto_id');

      addMemberModalMessage.textContent = '';

      if (!matriculaAluno) {
        addMemberModalMessage.textContent = 'Por favor, digite a matrícula do aluno.';
        addMemberModalMessage.style.color = 'red';
        return;
      }

      if (!projetoId) {
        addMemberModalMessage.textContent = 'ID do projeto não identificado.';
        addMemberModalMessage.style.color = 'red';
        return;
      }

      confirmAddMemberButton.disabled = true;
      addMemberModalMessage.textContent = 'Adicionando membro...';
      addMemberModalMessage.style.color = 'blue';

      const csrftoken = getCookie('csrftoken');

      if (typeof addMemberAjaxUrl === 'undefined') {
        console.error('A variável global addMemberAjaxUrl não está definida.');
        addMemberModalMessage.textContent = 'Erro de configuração: URL não encontrada.';
        addMemberModalMessage.style.color = 'red';
        confirmAddMemberButton.disabled = false;
        return;
      }

      const formData = new FormData();
      formData.append('matricula_aluno', matriculaAluno);
      formData.append('projeto_id', projetoId);

      fetch(addMemberAjaxUrl, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrftoken },
        body: formData
      })
        .then(response => response.json().then(data => ({ status: response.status, ok: response.ok, body: data })))
        .then(result => {
          const data = result.body;
          if (result.ok && data.status === 'success') {
            addMemberModalMessage.textContent = data.message;
            addMemberModalMessage.style.color = 'green';
            memberSearchInput.value = '';
            setTimeout(() => {
              closeAddMembersModal();
              window.location.reload();
            }, 2000);
          } else {
            addMemberModalMessage.textContent = data.message || `Erro ${result.status}`;
            addMemberModalMessage.style.color = 'red';
            confirmAddMemberButton.disabled = false;
          }
        })
        .catch(error => {
          console.error('Erro na requisição AJAX:', error);
          addMemberModalMessage.textContent = 'Erro de comunicação.';
          addMemberModalMessage.style.color = 'red';
          confirmAddMemberButton.disabled = false;
        });
    });
  }

  if (addMembersOption) {
    addMembersOption.addEventListener('click', e => {
      e.stopPropagation();
      openAddMembersModal();
    });
  }

  if (closeAddMembersModalButton) {
    closeAddMembersModalButton.addEventListener('click', () => {
      closeAddMembersModal();
    });
  }

  if (addMembersModal) {
    addMembersModal.addEventListener('click', event => event.stopPropagation());
  }

  return { openAddMembersModal, closeAddMembersModal };
}
