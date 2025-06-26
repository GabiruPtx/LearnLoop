export function setupTabs() {
  const tabsMenu = document.getElementById('tabsMenu');
  if (!tabsMenu) return;

  const tabs = tabsMenu.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', function () {
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      tabContents.forEach(content => content.classList.remove('active-content'));
      const targetContent = document.getElementById(`content-${this.dataset.tab}`);
      if (targetContent) {
        targetContent.classList.add('active-content');
      }
    });
  });
}