// learnloop/public/static/public/scripts/sidebarMenus.js

import { calculateDaysRemaining, getCookie, formatDateStatus, getDateClass} from './utils.js';

function isColorLight(hex) {
    if (!hex || !hex.startsWith('#')) return true;
    try {
        const [r, g, b] = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
        return (r * 299 + g * 587 + b * 114) / 1000 > 150;
    } catch { return true; }
}

function sanitizeHTML(str) {
	const temp = document.createElement('div');
	temp.textContent = str;
	return temp.innerHTML;
}

// Função principal que configura todos os menus da barra lateral
export function setupSidebarMenus() {
    const modal = document.getElementById('taskDetailModal');
    if (!modal) return;

    // Mapeamento de cada seção da barra lateral para seus elementos e lógica
    const menuConfigs = {
        'responsaveis': {
            fetchUrl: (projectId) => `/projeto/${projectId}/participantes/`,
            dataKey: 'participantes',
            render: (items, selectedIds) => {
                const header = `<div class="assignee-menu-header"><h4 style="margin: 0; padding: 5px 10px;">Atribuir para</h4></div>`;
                const listItems = items.map(item => `
                <div class="sidebar-menu-item">
                    <label>
                        <input type="checkbox" value="${item.id}" ${selectedIds.includes(item.id) ? 'checked' : ''}>
                        ${sanitizeHTML(item.nome_completo)}
                    </label>
                </div>
            `).join('');
                return header + listItems;
            },
            isMultiSelect: true
        },
        'tags': {
            fetchUrl: () => window.MANAGE_LABELS_URL,
            dataKey: 'labels',
            render: (items, selectedIds) => {
                const header = `<div class="assignee-menu-header"><h4 style="margin: 0; padding: 5px 10px;">Aplicar uma label</h4></div>`;
                const listItems = items.map(item => `
                    <div class="sidebar-menu-item">
                        <label class="d-flex align-items-center">
                            <input type="checkbox" value="${item.id}" ${selectedIds.includes(item.id) ? 'checked' : ''}>
                            <span class="meta-tag label-tag-card" style="background-color: ${item.color}; color: ${isColorLight(item.color) ? '#000' : '#FFF'}; margin-left: 8px;">
                                ${sanitizeHTML(item.name)}
                            </span>
                        </label>
                    </div>
                `).join('');
                return header + listItems;
            },
            isMultiSelect: true
        },
        'milestone': {
            fetchUrl: (projectId) => `/projeto/${projectId}/milestones/`,
            dataKey: 'milestones',
                    render: (items, selectedIds) => {
                        const header = `<div class="assignee-menu-header"><h4 style="margin: 0; padding: 5px 10px;">Definir milestone</h4></div>`;
                        const noMilestoneOption = `
                            <div class="sidebar-menu-item">
                                <label>
                                    <input type="radio" name="milestone-option" value="" ${selectedIds.length === 0 ? 'checked' : ''}>
                                    Nenhum milestone
                                </label>
                            </div>`;
                        const listItems = items.map(item => `
                        <div class="sidebar-menu-item">
                            <label>
                                <input type="radio" name="milestone-option" value="${item.id}" ${selectedIds.includes(item.id) ? 'checked' : ''}>
                                ${sanitizeHTML(item.nome)}
                            </label>
                        </div>
                        `).join('');
                        return header + noMilestoneOption + listItems;
                    },
                    isMultiSelect: false
            },
        'sprint': {
            fetchUrl: (projectId) => `/projeto/${projectId}/sprints-ajax/`,
            dataKey: 'sprints',
            render: (items, selectedIds) => {
                const header = `<div class="assignee-menu-header"><h4 style="margin: 0; padding: 5px 10px;">Definir sprint</h4></div>`;
                 const noSprint = `
                    <div class="sidebar-menu-item">
                        <label>
                            <input type="radio" name="sprint-option" value="" ${selectedIds.length === 0 ? 'checked' : ''}>
                            Nenhum sprint
                        </label>
                    </div>`;
                const listItems = items.map(item => `
                <div class="sidebar-menu-item">
                     <label>
                        <input type="radio" name="sprint-option" value="${item.id}" ${selectedIds.includes(item.id) ? 'checked' : ''}>
                        ${sanitizeHTML(item.nome)}
                    </label>
                </div>
            `).join('');
                return header + noSprint + listItems;
            },
            isMultiSelect: false
        },
        'prioridade': {
            fetchUrl: () => window.MANAGE_PRIORITIES_URL,
            dataKey: 'prioridades',
            render: (items, selectedIds) => {
                const header = `<div class="assignee-menu-header"><h4 style="margin: 0; padding: 5px 10px;">Definir prioridade</h4></div>`;
                const noPriority = `
                    <div class="sidebar-menu-item">
                        <label>
                            <input type="radio" name="priority-option" value="" ${selectedIds.length === 0 ? 'checked' : ''}>
                            Nenhuma prioridade
                        </label>
                    </div>`;
                const listItems = items.map(item => `
                    <div class="sidebar-menu-item">
                        <label class="d-flex align-items-center">
                            <input type="radio" name="priority-option" value="${item.id}" ${selectedIds.includes(item.id) ? 'checked' : ''}>
                            <span class="meta-tag" style="background-color: ${item.cor}; color: ${isColorLight(item.cor) ? '#000' : '#FFF'}; margin-left: 8px;">${sanitizeHTML(item.nome)}</span>
                        </label>
                    </div>
                `).join('');
                return header + noPriority + listItems;
            },
            isMultiSelect: false
        },
        'tamanho': {
            fetchUrl: () => window.MANAGE_SIZES_URL,
            dataKey: 'tamanhos',
            render: (items, selectedIds) => {
                const header = `<div class="assignee-menu-header"><h4 style="margin: 0; padding: 5px 10px;">Definir tamanho</h4></div>`;
                const noSize = `
                    <div class="sidebar-menu-item">
                        <label>
                            <input type="radio" name="size-option" value="" ${selectedIds.length === 0 ? 'checked' : ''}>
                            Nenhum tamanho
                        </label>
                    </div>`;
                const listItems = items.map(item => `
                    <div class="sidebar-menu-item">
                        <label class="d-flex align-items-center">
                            <input type="radio" name="size-option" value="${item.id}" ${selectedIds.includes(item.id) ? 'checked' : ''}>
                            <span class="meta-tag" style="background-color: ${item.cor}; color: ${isColorLight(item.cor) ? '#000' : '#FFF'}; margin-left: 8px;">${sanitizeHTML(item.nome)}</span>
                        </label>
                    </div>
                `).join('');
                return header + noSize + listItems;
            },
            isMultiSelect: false
        }
    };

    // Itera sobre cada configuração para adicionar os listeners
    Object.keys(menuConfigs).forEach(key => {
        const section = document.getElementById(`sidebar-${key}`);
        if (!section) return;

        const header = section.querySelector('.sidebar-header');
        const menuPopup = section.querySelector('.sidebar-menu-popup');

        if (header && menuPopup) {
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleMenu(menuPopup, key, menuConfigs[key]);
            });
        }
    });

    // Função para abrir/fechar um menu
    async function toggleMenu(menuPopup, key, config) {
        // Fecha outros menus abertos
        document.querySelectorAll('.sidebar-menu-popup.visible').forEach(p => {
            if (p !== menuPopup) p.classList.remove('visible');
        });
        if (menuPopup._changeHandler) {
        menuPopup.removeEventListener('change', menuPopup._changeHandler);
        }
        const isVisible = menuPopup.classList.toggle('visible');

        if (isVisible) {
            menuPopup.innerHTML = '<div class="sidebar-menu-item">Carregando...</div>';
            const modal = document.getElementById('taskDetailModal');
            const taskId = modal.dataset.taskId;
            const projectId = modal.dataset.projectId;

            try {
                // Busca os dados para popular o menu
                const response = await fetch(config.fetchUrl(projectId));
                const data = await response.json();

                // Extrai a lista de itens do objeto de resposta
                const items = data[config.dataKey] || [];

                // Pega os IDs atualmente selecionados para a tarefa
                const currentSelection = JSON.parse(modal.dataset.currentSelection || '{}');
                const selectedIds = currentSelection[key] || [];

                  menuPopup.innerHTML = config.render(items, selectedIds);

                // Cria a nova função de "ouvinte" com o contexto atual (taskId, key, config).
                const newHandler = (e) => handleSelectionChange(e, key, taskId, config);

                // Guarda uma referência à nova função no próprio elemento do menu.
                menuPopup._changeHandler = newHandler;

                // Adiciona o novo "ouvinte" de evento.
                menuPopup.addEventListener('change', newHandler);

            } catch (error) {
                menuPopup.innerHTML = '<div class="sidebar-menu-item" style="color:red;">Erro ao carregar.</div>';
                console.error(`Erro ao buscar dados para ${key}:`, error);
            }
        }
    }

    // Função para tratar a mudança de seleção no menu
    async function handleSelectionChange(event, attribute, taskId, config) {
        let value;
        if (config.isMultiSelect) {
            // Pega todos os checkboxes marcados
            value = Array.from(event.currentTarget.querySelectorAll('input:checked')).map(input => input.value);
        } else {
            // Pega o radio button marcado
            value = event.target.value;
        }

        const result = await updateTaskAttribute(taskId, attribute, value);
        if (result.status === 'success') {
            const modal = document.getElementById('taskDetailModal');
            const currentSelection = JSON.parse(modal.dataset.currentSelection || '{}');

            if (config.isMultiSelect) {
                currentSelection[attribute] = result.new_data ? result.new_data.map(item => item.id) : [];
            } else {
                currentSelection[attribute] = result.new_data ? [result.new_data.id] : [];
            }
            modal.dataset.currentSelection = JSON.stringify(currentSelection);

            updateSidebarUI(attribute, result.new_data);

            if (!config.isMultiSelect) {
                document.querySelector(`#sidebar-${attribute} .sidebar-menu-popup`).classList.remove('visible');
            }
        } else {
            alert(`Erro ao atualizar: ${result.message}`);
        }
    }

    // Função para enviar a atualização para o backend
    async function updateTaskAttribute(taskId, attribute, value) {
        const url = `/tarefa/${taskId}/update-sidebar/`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ attribute, value })
            });
            return await response.json();
        } catch (error) {
            console.error('Falha ao atualizar atributo da tarefa:', error);
            return { status: 'error', message: 'Erro de comunicação.' };
        }
    }

    // Função para atualizar a UI da barra lateral após uma mudança bem-sucedida
    function updateSidebarUI(attribute, data) {
        const contentDiv = document.querySelector(`#sidebar-${attribute} .sidebar-content`);
        if (!contentDiv) return;

        let newHtml = '<span>Nenhum</span>';
        if (data && (Array.isArray(data) ? data.length > 0 : (data.id !== undefined && data.id !== null))) {
            const dataArray = Array.isArray(data) ? data : [data];

            switch (attribute) {
                case 'responsaveis':
                      newHtml = dataArray.map(user =>
                        `<div class="assignee-avatar" title="${sanitizeHTML(user.nome_completo)}">
                            <img src="/static/${user.avatar}" alt="${sanitizeHTML(user.nome_completo)}">
                        </div>`
                      ).join('');
                      break;
                case 'tags':
                    newHtml = dataArray.map(tag => {
                        const textColor = isColorLight(tag.cor) ? '#000' : '#FFF';
                        return `<span class="meta-tag label-tag-card" style="background-color: ${tag.cor}; color: ${textColor};">${sanitizeHTML(tag.nome)}</span>`;
                    }).join('');
                    break;
                case 'milestone':
                     const milestone = dataArray[0];
                        if (milestone && milestone.id) {
                            const progress = milestone.total_tasks > 0 ? (milestone.completed_tasks / milestone.total_tasks) * 100 : 0;
                            const daysRemaining = calculateDaysRemaining(milestone.data_limite);
                            const dateText = formatDateStatus(daysRemaining);
                            const dateClass = getDateClass(daysRemaining);
                            newHtml = `
                                <div class="milestone-sidebar-info">
                                    <strong>${sanitizeHTML(milestone.nome)}</strong>
                                    <div class="milestone-date ${dateClass}">${dateText}</div>
                                    <div class="milestone-progress">
                                        <div class="progress-bar-container">
                                            <div class="progress-bar" style="width: ${progress.toFixed(2)}%;"></div>
                                        </div>
                                        <span class="progress-text">${progress.toFixed(0)}%</span>
                                    </div>
                                </div>
                            `;
                        }
                        break;
                case 'sprint':
                    newHtml = `<strong>${sanitizeHTML(dataArray[0].nome)}</strong>`;
                    break;

                case 'prioridade':
                case 'tamanho':
                     if (dataArray[0] && dataArray[0].id) {
                        const item = dataArray[0];
                        const textColor = isColorLight(item.cor) ? '#000' : '#FFF';
                        newHtml = `<span class="meta-tag" style="background-color: ${item.cor}; color: ${textColor}; border: 1px solid ${item.cor};">${sanitizeHTML(item.nome)}</span>`;
                    }
                    break;
            }
        }
        contentDiv.innerHTML = newHtml;
    }


    // Fecha os menus se clicar fora
    document.addEventListener('click', (e) => {
        const openMenu = document.querySelector('.sidebar-menu-popup.visible');
        if (openMenu) {
            const parentSection = openMenu.closest('.sidebar-section');
            if (parentSection && !parentSection.contains(e.target)) {
                openMenu.classList.remove('visible');
            }
        }
    });
}