import { setupPasswordToggles } from './passwordToggle.js';
import { setupTabs } from './tabs.js';
import { setupHorizontalScroll } from './horizontalScroll.js';
import { setupProjectMenu } from './projectMenu.js';
import { setupMembersModal } from './membersModal.js';
import { setupProjectModal } from './projectModal.js';
import { setupTaskModal } from './taskModal.js';
import { setupAssigneeMenu } from './assigneeMenu.js';
import { setupConfiguracaoPage } from './configuracao.js';
import { setupPrioritySettings } from './prioritySettings.js';
// Substitua pelos caminhos corretos das imagens usadas para alternar a visibilidade da senha
const eyeOpenSrc = '/static/public/images/eye.svg';
const eyeClosedSrc = '/static/public/images/Eye%20off.svg';

document.addEventListener('DOMContentLoaded', () => {
  setupPasswordToggles(eyeOpenSrc, eyeClosedSrc);
  setupTabs();
  setupHorizontalScroll();
  setupProjectMenu();
  setupMembersModal();
  setupProjectModal();
  setupTaskModal();
  setupAssigneeMenu();
  setupConfiguracaoPage();
  setupPrioritySettings();
});