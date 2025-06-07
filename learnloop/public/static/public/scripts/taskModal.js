import { getCookie } from './utils.js';
import { getSelectedAssignees, clearSelectedAssignees } from './assigneeMenu.js';

export function setupTaskModal() {
  const addTaskModal = document.getElementById('addTaskModal');
  if (!addTaskModal) return;

  const openTaskModalButtons = document.querySelectorAll('.add-task-button'); // Botões "Adicionar Task" nas colunas
  const closeButton = document.getElementById('closeAddTaskModal');
  const cancelButton = document.getElementById('cancelAddTaskButton');
  const taskForm = document.getElementById('addTaskForm');
  // Inicializa o editor de texto
  // Certifique-se de ter incluído o JS do EasyMDE na sua página
  const easyMDE = new EasyMDE({
      element: document.getElementById('taskDescriptionEditor'),
      spellChecker: false,
      placeholder: "Digite a descrição, use @ para mencionar usuários, anexe arquivos...",
      toolbar: ["bold", "italic", "strikethrough", "|", "quote", "code", "link", "|", "unordered-list", "ordered-list", "|", "preview", "side-by-side", "fullscreen"],
  });

   function openModal(event) {
    const column = event.currentTarget.closest('.board-column');
    const status = column.dataset.status || 'PENDENTE';
    taskForm.dataset.initialStatus = status;
    addTaskModal.style.display = 'flex';
  }

  function closeModal() {
    addTaskModal.style.display = 'none';
    taskForm.reset();
    easyMDE.value('');
    // Limpa checkboxes de participantes
    clearSelectedAssignees();
  }

  openTaskModalButtons.forEach(button => {
      button.addEventListener('click', openModal);
  });

  closeButton.addEventListener('click', closeModal);
  cancelButton.addEventListener('click', closeModal);

  window.addEventListener('click', (event) => {
    if (event.target === addTaskModal) {
      closeModal();
    }
  });

  taskForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const title = document.getElementById('taskTitleInput').value;
      const description = easyMDE.value();
      const projectId = new URLSearchParams(window.location.search).get('projeto_id');

      if (!title.trim()) {
          alert('O título da tarefa é obrigatório.');
          return;
      }

      const formData = new FormData();
      formData.append('task_title', title);
      formData.append('task_description', description);
      formData.append('project_id', projectId);

      // Coleta os IDs dos responsáveis selecionados
      const assigneeIds = getSelectedAssignees();
      assigneeIds.forEach(id => {
          formData.append('responsaveis[]', id);
      });

      // AJAX para criar a tarefa
      fetch(createTaskAjaxUrl, {
          method: 'POST',
          headers: { 'X-CSRFToken': getCookie('csrftoken') },
          body: formData
      })
      .then(response => response.json())
      .then(data => {
          if(data.status === 'success') {
              closeModal();
              window.location.reload(); // Recarrega para ver a nova tarefa
          } else {
              alert('Erro ao criar tarefa: ' + data.message);
          }
      }).catch(error => {
        console.error("Erro no fetch:", error);
        alert("Erro de comunicação com o servidor.");
      });
  });

}