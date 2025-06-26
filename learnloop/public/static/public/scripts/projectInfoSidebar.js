// learnloop/public/static/public/scripts/projectInfoSidebar.js
import { getCookie } from './utils.js';

export function setupProjectInfoSidebar() {
    // Elements
    const toggleBtn = document.getElementById('toggleProjectInfoSidebarBtn');
    const sidebar = document.getElementById('projectInfoSidebar');
    const overlay = document.getElementById('project-info-overlay');
    const closeBtn = document.getElementById('closeProjectInfoSidebarBtn');

    if (!toggleBtn || !sidebar || !overlay || !closeBtn) {
        return;
    }

    // --- DESCRIÇÃO ELEMENTS ---
    const descDisplayView = document.getElementById('descricao-display-view');
    const descEditView = document.getElementById('descricao-edit-view');
    const editDescBtn = document.getElementById('edit-descricao-btn');
    const cancelDescBtn = document.getElementById('cancel-descricao-btn');
    const descEditForm = document.getElementById('descricao-edit-form');
    const descEditorTextarea = document.getElementById('info-sidebar-descricao-editor');

    // --- README ELEMENTS ---
    const readmeDisplayView = document.getElementById('readme-display-view');
    const readmeEditView = document.getElementById('readme-edit-view');
    const editReadmeBtn = document.getElementById('edit-readme-btn');
    const cancelReadmeBtn = document.getElementById('cancel-readme-btn');
    const readmeEditForm = document.getElementById('readme-edit-form');
    const readmeEditorTextarea = document.getElementById('info-sidebar-readme-editor');
    let readmeEditor; // To hold the EasyMDE instance for README

    // --- STATUS UPDATE ELEMENTS ---
    const statusDisplayView = document.getElementById('status-display-view');
    const statusEditView = document.getElementById('status-edit-view');
    const addStatusUpdateBtn = document.getElementById('add-status-update-btn');
    const saveStatusUpdateBtn = document.getElementById('save-status-update-btn');
    const cancelStatusUpdateBtn = document.getElementById('cancel-status-update-btn');
    const statusUpdateForm = document.getElementById('status-update-form');
    const statusSelect = document.getElementById('status-update-select');
    const startDateInput = document.getElementById('status-start-date');
    const targetDateInput = document.getElementById('status-target-date');
    const statusEditorTextarea = document.getElementById('status-update-editor');
    let statusEditor;
    let startDatePicker, targetDatePicker;

    // --- STATE ---
    let currentProjectDetails = {};

    // --- GENERAL FUNCTIONS ---

    const openSidebar = async () => {
        if (typeof getProjectDetailsAjaxUrl === 'undefined' || !getProjectDetailsAjaxUrl) {
            console.error("URL de detalhes do projeto não está definida.");
            return;
        }

        sidebar.classList.add('visible');
        overlay.classList.add('visible');

        try {
            const response = await fetch(getProjectDetailsAjaxUrl);
            const data = await response.json();

            if (data.status === 'success') {
                currentProjectDetails = data.details; // Store details
                populateSidebar(currentProjectDetails);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            document.getElementById('info-sidebar-descricao').textContent = `Erro ao carregar: ${error.message}`;
        }
    };

    const closeSidebar = () => {
        sidebar.classList.remove('visible');
        overlay.classList.remove('visible');
        switchToDisplayView('all'); // Ensure all edit views are hidden
        resetSidebar();
    };

    const populateSidebar = (details) => {
        // Populate Description
        document.getElementById('info-sidebar-descricao').textContent = details.descricao || "Nenhuma descrição fornecida.";
        // Populate README
        document.getElementById('info-sidebar-readme').innerHTML = details.readme_html;

        // Populate status display view
        const statusContentDiv = document.getElementById('status-details-content');
        if (statusContentDiv) {
            statusContentDiv.innerHTML = `
                <div class="status-item">
                    <img src="/static/public/images/Calendar.svg" alt="Data de Início">
                    <span>Start date:</span>
                    <strong>${details.data_inicio ? new Date(details.data_inicio).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'Not set'}</strong>
                </div>
                <div class="status-item">
                    <img src="/static/public/images/Rocket.svg" alt="Data Limite">
                    <span>Target date:</span>
                    <strong>${details.data_limite ? new Date(details.data_limite).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'Not set'}</strong>
                </div>
                <div class="status-item">
                     <span class="status-tag-sidebar" style="background-color: #e0e0e0;">${details.status_display}</span>
                </div>
                <div class="readme-content" style="margin-top: 15px;">
                    ${details.status_update_html}
                </div>
            `;
        }

        // Atualiza também o botão de status no header principal
        const headerStatusButton = document.querySelector('.status-button h3');
        if (headerStatusButton) {
            headerStatusButton.textContent = details.status_display;
        }
    };

    const resetSidebar = () => {
        document.getElementById('info-sidebar-descricao').textContent = 'Carregando...';
        document.getElementById('info-sidebar-readme').innerHTML = 'Carregando...';
        const statusContentDiv = document.getElementById('status-details-content');
        if (statusContentDiv) statusContentDiv.innerHTML = '';
        currentProjectDetails = {};
    };

    function switchToDisplayView(section) {
        if (section === 'descricao' || section === 'all') {
            if(descDisplayView) descDisplayView.style.display = 'block';
            if(descEditView) descEditView.style.display = 'none';
        }
        if (section === 'readme' || section === 'all') {
            if(readmeDisplayView) readmeDisplayView.style.display = 'block';
            if(readmeEditView) readmeEditView.style.display = 'none';
            if (readmeEditor) {
                readmeEditor.toTextArea();
                readmeEditor = null;
            }
        }
        if (section === 'status' || section === 'all') {
            if(statusDisplayView) statusDisplayView.style.display = 'block';
            if(statusEditView) statusEditView.style.display = 'none';
            if (statusEditor) {
                statusEditor.toTextArea();
                statusEditor = null;
            }
        }
    }

    async function saveProjectDetails(updatedData) {
        if (typeof saveDetailsAjaxUrl === 'undefined' || !saveDetailsAjaxUrl) {
            throw new Error("URL para salvar detalhes não definida.");
        }

        const payload = {
            nome: currentProjectDetails.nome,
            descricao: currentProjectDetails.descricao,
            readme: currentProjectDetails.readme_raw,
            ...updatedData
        };

        const response = await fetch(saveDetailsAjaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRFToken': getCookie('csrftoken') },
            body: new URLSearchParams(payload)
        });

        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(result.message || 'Falha ao salvar.');
        }
        return result;
    }

    // --- EVENT LISTENERS ---
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.contains('visible') ? closeSidebar() : openSidebar();
    });
    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    // -- Description Listeners --
    if (editDescBtn) {
        editDescBtn.addEventListener('click', () => {
            descDisplayView.style.display = 'none';
            descEditView.style.display = 'block';
            descEditorTextarea.value = currentProjectDetails.descricao;
        });
    }

    if (cancelDescBtn) {
        cancelDescBtn.addEventListener('click', () => switchToDisplayView('descricao'));
    }

    if (descEditForm) {
        descEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const button = e.target.querySelector('button[type="submit"]');
            button.disabled = true;
            button.textContent = 'Salvando...';

            try {
                await saveProjectDetails({ descricao: descEditorTextarea.value.trim() });
                await fetch(getProjectDetailsAjaxUrl).then(res => res.json()).then(data => {
                    if(data.status === 'success') {
                        currentProjectDetails = data.details;
                        populateSidebar(currentProjectDetails);
                    }
                });
                switchToDisplayView('descricao');
            } catch(error) {
                alert(`Erro ao salvar descrição: ${error.message}`);
            } finally {
                button.disabled = false;
                button.textContent = 'Salvar';
            }
        });
    }

    // -- README Listeners --
    if (editReadmeBtn) {
        editReadmeBtn.addEventListener('click', () => {
            readmeDisplayView.style.display = 'none';
            readmeEditView.style.display = 'block';
            if (!readmeEditor) {
                readmeEditor = new EasyMDE({
                    element: readmeEditorTextarea,
                    initialValue: currentProjectDetails.readme_raw,
                    spellChecker: false, minHeight: '200px',
                    placeholder: "Escreva o README do seu projeto aqui...",
                    toolbar: ["bold", "italic", "strikethrough", "|", "quote", "code", "link", "|", "unordered-list", "ordered-list", "|", "preview"],
                });
            }
        });
    }

    if(cancelReadmeBtn) {
        cancelReadmeBtn.addEventListener('click', () => switchToDisplayView('readme'));
    }

    if(readmeEditForm) {
        readmeEditForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const button = e.target.querySelector('button[type="submit"]');
            button.disabled = true;
            button.textContent = 'Salvando...';

            try {
                await saveProjectDetails({ readme: readmeEditor.value() });
                await fetch(getProjectDetailsAjaxUrl).then(res => res.json()).then(data => {
                     if(data.status === 'success') {
                        currentProjectDetails = data.details;
                        populateSidebar(currentProjectDetails);
                    }
                });
                switchToDisplayView('readme');
            } catch(error) {
                alert(`Erro ao salvar README: ${error.message}`);
            } finally {
                button.disabled = false;
                button.textContent = 'Salvar';
            }
        });
    }


    // -- Status Update Listeners (existing logic) --
    if (addStatusUpdateBtn) {
        addStatusUpdateBtn.addEventListener('click', () => {
             // Logic to switch to status edit view
            statusDisplayView.style.display = 'none';
            statusEditView.style.display = 'block';

            statusSelect.innerHTML = '';
            currentProjectDetails.status_choices.forEach(choice => {
                const option = document.createElement('option');
                option.value = choice.value;
                option.textContent = choice.display;
                if (choice.value === currentProjectDetails.status) option.selected = true;
                statusSelect.appendChild(option);
            });

            if (!statusEditor) {
                statusEditor = new EasyMDE({
                    element: statusEditorTextarea,
                    spellChecker: false, minHeight: '150px',
                    toolbar: ["bold", "italic", "strikethrough", "link", "unordered-list", "ordered-list", "preview"],
                });
            }
            statusEditor.value(currentProjectDetails.status_update_raw);

            const flatpickrConfig = { dateFormat: "Y-m-d", altInput: true, altFormat: "F j, Y" };
            if (startDatePicker) startDatePicker.destroy();
            if (targetDatePicker) targetDatePicker.destroy();
            startDatePicker = flatpickr(startDateInput, { ...flatpickrConfig, defaultDate: currentProjectDetails.data_inicio });
            targetDatePicker = flatpickr(targetDateInput, { ...flatpickrConfig, defaultDate: currentProjectDetails.data_limite });
        });
    }
    if (cancelStatusUpdateBtn) {
        cancelStatusUpdateBtn.addEventListener('click', () => switchToDisplayView('status'));
    }

    if (statusUpdateForm) {
        statusUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            saveStatusUpdateBtn.disabled = true;
            saveStatusUpdateBtn.textContent = 'Saving...';

            const payload = {
                status: statusSelect.value,
                start_date: startDatePicker.selectedDates[0] ? startDatePicker.formatDate(startDatePicker.selectedDates[0], "Y-m-d") : null,
                target_date: targetDatePicker.selectedDates[0] ? targetDatePicker.formatDate(targetDatePicker.selectedDates[0], "Y-m-d") : null,
                update_text: statusEditor.value()
            };

            try {
                 if (typeof updateProjectStatusAjaxUrl === 'undefined' || !updateProjectStatusAjaxUrl) {
                    throw new Error("URL para atualizar status não definida.");
                }

                const response = await fetch(updateProjectStatusAjaxUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                if (data.status === 'success') {
                    currentProjectDetails = data.details;
                    populateSidebar(data.details);
                    switchToDisplayView('status');

                    // Atualiza o botão de status no header principal
                    const headerStatusButton = document.querySelector('.status-button h3');
                    if (headerStatusButton) {
                        headerStatusButton.textContent = data.details.status_display;
                    }
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                alert(`Error saving update: ${error.message}`);
            } finally {
                saveStatusUpdateBtn.disabled = false;
                saveStatusUpdateBtn.textContent = 'Save update';
            }
        });
    }
}