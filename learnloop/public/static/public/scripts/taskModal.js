export function setupTaskModal() {
  const addTaskModal = document.getElementById('addTaskModal');
  if (!addTaskModal) return;

  const openTaskModalButtons = document.querySelectorAll('.add-task-button'); // Botões "Adicionar Task" nas colunas
  const closeButton = document.getElementById('closeAddTaskModal');
  const cancelButton = document.getElementById('cancelAddTaskButton');

  // Inicializa o editor de texto
  // Certifique-se de ter incluído o JS do EasyMDE na sua página
  const easyMDE = new EasyMDE({
      element: document.getElementById('taskDescriptionEditor'),
      spellChecker: false,
      placeholder: "Digite a descrição, use @ para mencionar usuários, anexe arquivos...",
      toolbar: ["bold", "italic", "strikethrough", "|", "quote", "code", "link", "|", "unordered-list", "ordered-list", "|", "preview", "side-by-side", "fullscreen"],
  });

  function openModal() {
    addTaskModal.style.display = 'flex';
  }

  function closeModal() {
    addTaskModal.style.display = 'none';
    // Opcional: Limpar campos ao fechar
    document.getElementById('taskTitleInput').value = '';
    easyMDE.value('');
  }

  // Event listeners para abrir o modal
  openTaskModalButtons.forEach(button => {
      button.addEventListener('click', openModal);
  });

  // Event listeners para fechar o modal
  closeButton.addEventListener('click', closeModal);
  cancelButton.addEventListener('click', closeModal);

  // Fechar ao clicar fora do conteúdo do modal
  window.addEventListener('click', (event) => {
    if (event.target === addTaskModal) {
      closeModal();
    }
  });

  // Lógica para submeter o formulário (AJAX)
  const taskForm = document.getElementById('addTaskForm');
  taskForm.addEventListener('submit', (event) => {
      event.preventDefault(); // Impede o recarregamento da página

      const title = document.getElementById('taskTitleInput').value;
      const description = easyMDE.value();

      // Validação simples
      if (!title.trim()) {
          alert('O título da tarefa é obrigatório.');
          return;
      }

      console.log('Criando task:', { title, description });
      // Aqui você adicionaria sua lógica de fetch (AJAX) para a URL 'createTaskAjaxUrl'
      // Exemplo:
      /*
      fetch(createTaskAjaxUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
          body: JSON.stringify({
              task_title: title,
              task_description: description,
              project_id: // você precisa obter o ID do projeto atual
          })
      })
      .then(response => response.json())
      .then(data => {
          if(data.status === 'success') {
              closeModal();
              window.location.reload(); // Ou atualize a coluna de tasks dinamicamente
          } else {
              alert('Erro: ' + data.message);
          }
      });
      */
      closeModal(); // Apenas para demonstração
  });

}