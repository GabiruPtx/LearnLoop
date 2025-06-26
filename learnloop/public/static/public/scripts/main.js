import { setupPasswordToggles } from './passwordToggle.js';
import { setupTabs } from './tabs.js';
import { setupHorizontalScroll } from './horizontalScroll.js';
import { setupProjectMenu } from './projectMenu.js';
import { setupMembersModal } from './membersModal.js';
import { setupProjectModal } from './projectModal.js';
import { setupTaskModal } from './taskModal.js';
import { setupAssigneeMenu } from './assigneeMenu.js';
import { setupMilestoneMenu } from './milestoneMenu.js';
import { setupConfiguracaoPage } from './configuracao.js';
import { setupPrioritySettings } from './prioritySettings.js';
import { setupSizeSettings } from './sizeSettings.js';
import { setupSprintSettings } from './sprintSettings.js';
import { setupMilestoneSettings } from './milestoneSettings.js';
import { setupAccessSettings } from './accessSettings.js';
import { setupLabelSettings } from './labelSettings.js';
import { setupProjectSettings } from './projectSettings.js';
import { setupLabelMenu } from './labelMenu.js';
import { setupDragAndDrop } from './dragAndDrop.js';
import { setupTaskDetailModal } from './taskDetailModal.js';
import { setupSidebarMenus } from './sidebarMenus.js';
import { setupColumnMenu } from './columnMenu.js';
import { setupProjectInfoSidebar } from './projectInfoSidebar.js';
import { setupPerfilPage } from './perfil.js';
import { setupRoadmapTab } from './roadmap.js';
const eyeOpenSrc = '/static/public/images/eye.svg';
const eyeClosedSrc = '/static/public/images/Eye%20off.svg';

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.password-container')) {
    setupPasswordToggles(eyeOpenSrc, eyeClosedSrc);
  }
  if (document.querySelector('.tabs-menu')) {
    setupTabs();
  }
  if (document.querySelector('.columns-container')) {
    setupHorizontalScroll();
  }
  if (document.querySelector('.more-options-icon') && document.getElementById('project-menu')) {
    setupProjectMenu();
  }
  if (document.getElementById('addMembersModal')) {
    setupMembersModal();
  }
  if (document.getElementById('addProjectModal')) {
    setupProjectModal();
  }
  if (document.getElementById('addTaskModal')) {
    setupTaskModal();
  }
  if (document.getElementById('openAssigneeMenuButton')) {
    setupAssigneeMenu();
  }
  if (document.getElementById('openMilestoneMenuButton')) {
    setupMilestoneMenu();
  }
  if (document.querySelector('.config-container')) {
    setupConfiguracaoPage();
  }
  if (document.querySelector('.priority-settings-container')) {
    setupPrioritySettings();
  }
  if (document.querySelector('.size-settings-container')) {
    setupSizeSettings();
  }
  if (document.querySelector('.iteration-settings-container')) {
    setupSprintSettings();
  }
  if (document.querySelector('.milestone-container')) {
    setupMilestoneSettings();
  }
  if (document.getElementById('acesso-papeis')) {
    setupAccessSettings();
  }
  if (document.getElementById('tags-labels')) {
    setupLabelSettings();
  }
  if (document.getElementById('closeProjectBtn')) {
    setupProjectSettings();
  }
  if (document.getElementById('openLabelMenuButton')) {
    setupLabelMenu();
  }
  if (document.querySelector('.task-card')) {
    setupDragAndDrop();
  }
  if (document.getElementById('taskDetailModal')) {
    setupTaskDetailModal();
    setupSidebarMenus();
  }
  if (document.querySelector('.columns-container')) {
    setupColumnMenu();
  }
  if (document.getElementById('toggleProjectInfoSidebarBtn')) {
    setupProjectInfoSidebar();
  }
  if (document.querySelector('.perfil-container')) {
    setupPerfilPage();
  }
  if (document.querySelector('.tab[data-tab="roadmap"]')) {
    setupRoadmapTab();
  }
});