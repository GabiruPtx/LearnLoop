export function setupProjectMenu() {
  const overlay = document.getElementById('overlay');
  const moreOptionsIcon = document.querySelector('.more-options-icon');
  const projectMenu = document.getElementById('project-menu');

  function openProjectMenu() {
    if (!projectMenu || projectMenu.classList.contains('active')) return;

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
    projectMenu.style.visibility = '';
    if (overlay) overlay.classList.add('active');
    setTimeout(() => document.addEventListener('click', handleDocumentClickForProjectMenu), 0);
  }

  function closeProjectMenu() {
    if (!projectMenu || !projectMenu.classList.contains('active')) return;
    projectMenu.classList.remove('active');
    document.removeEventListener('click', handleDocumentClickForProjectMenu);
    if (overlay && (!document.getElementById('addMembersModal')?.classList.contains('active'))) {
      overlay.classList.remove('active');
    }
  }

  function handleDocumentClickForProjectMenu(event) {
    if (projectMenu && !projectMenu.contains(event.target) &&
        moreOptionsIcon && !moreOptionsIcon.contains(event.target)) {
      closeProjectMenu();
    }
  }

  if (moreOptionsIcon && projectMenu) {
    moreOptionsIcon.addEventListener('click', (event) => {
      event.stopPropagation();
      projectMenu.classList.contains('active') ? closeProjectMenu() : openProjectMenu();
    });
  }

  if (projectMenu) {
    projectMenu.addEventListener('click', (event) => event.stopPropagation());
    projectMenu.querySelectorAll('.menu-item').forEach(item => {
      if (item.id !== 'addMembersOption') {
        item.addEventListener('click', () => closeProjectMenu());
      }
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      const addMembersModal = document.getElementById('addMembersModal');
      if (addMembersModal && addMembersModal.classList.contains('active')) return;
      if (projectMenu && projectMenu.classList.contains('active')) closeProjectMenu();
    });
  }
}