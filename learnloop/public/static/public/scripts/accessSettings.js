// Função auxiliar para pegar o CSRF token do Django
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Função para "atrasar" a busca e não sobrecarregar o servidor
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

export function setupAccessSettings() {
    const container = document.getElementById('acesso-papeis');
    if (!container) return;
    
    const projectId = window.PROJECT_ID;
    if (!projectId) return;

    // --- ELEMENTOS DA UI ---
    const userSearchInput = document.getElementById('user-search-input');
    const searchResultsDropdown = document.getElementById('user-search-results');
    const inviteBtn = document.getElementById('invite-users-btn');
    const inviteStatusMessage = document.getElementById('invite-status-message');
    const memberList = document.getElementById('member-list');
    const memberListSearch = document.getElementById('member-list-search');
    const memberCountSpan = document.getElementById('member-count'); // Pega o span do contador
    const removeSelectedBtn = document.getElementById('remove-selected-btn');
    const selectAllCheckbox = document.getElementById('select-all-members-checkbox');
    const removeUserModal = document.getElementById('remove-user-modal');
    const confirmRemoveBtn = document.getElementById('confirm-remove-btn');
    
    // Dropdowns de filtro
    const inviteFilterBtn = document.getElementById('invite-filter-btn');
    const inviteFilterLabel = document.getElementById('invite-filter-label');
    const inviteFilterMenu = document.getElementById('invite-filter-menu');
    const manageFilterBtn = document.getElementById('manage-filter-btn');
    const manageFilterLabel = document.getElementById('manage-filter-label');
    const manageFilterMenu = document.getElementById('manage-filter-menu');

    let inviteFilterType = 'all';
    let manageFilterType = 'all';
    let itemsToRemove = [];

    // --- FUNÇÕES ---
    function setupDropdown(btn, menu, label, callback) {
        if (!btn || !menu || !label) return;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('visible');
        });
        menu.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.closest('.dropdown-item');
            if (target) {
                label.textContent = target.textContent;
                callback(target.dataset.type);
                menu.classList.remove('visible');
            }
        });
    }

    setupDropdown(inviteFilterBtn, inviteFilterMenu, inviteFilterLabel, (type) => {
        inviteFilterType = type;
        userSearchInput.dispatchEvent(new Event('input'));
    });
    setupDropdown(manageFilterBtn, manageFilterMenu, manageFilterLabel, (type) => {
        manageFilterType = type;
        memberListSearch.dispatchEvent(new Event('input'));
    });

    function showStatusMessage(message, isSuccess) {
        inviteStatusMessage.textContent = message;
        inviteStatusMessage.className = 'status-message';
        inviteStatusMessage.classList.add(isSuccess ? 'status-success' : 'status-error');
        inviteStatusMessage.style.display = 'block';
        setTimeout(() => {
            inviteStatusMessage.style.display = 'none';
        }, 5000);
    }

    const searchUsers = async (query) => {
        
        try {
            const url = `/projeto/${projectId}/search-users/?q=${encodeURIComponent(query)}&type=${inviteFilterType}`;
            const response = await fetch(url);
            const data = await response.json();
            
            searchResultsDropdown.innerHTML = '';
            if (data.users.length > 0) {
                data.users.forEach(user => {
                    const item = document.createElement('div');
                    item.className = 'search-result-item';
                    item.innerHTML = `
                        <input type="checkbox" class="user-to-invite-checkbox" data-user-id="${user.id}">
                        <img src="https://i.pravatar.cc/30?u=${user.matricula}" alt="Avatar" class="avatar" style="width:30px; height:30px; margin-right:10px;">
                        <div class="user-info">
                            <span class="user-name">${user.nome_completo}</span>
                            <span class="user-username">${user.matricula}</span>
                        </div>`;
                    searchResultsDropdown.appendChild(item);
                });
                searchResultsDropdown.style.display = 'block';
            } else {
                searchResultsDropdown.style.display = 'none';
            }
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
        }
    };

    userSearchInput.addEventListener('click', (e) => {
        searchUsers(e.target.value);
    });
    userSearchInput.addEventListener('input', debounce((e) => searchUsers(e.target.value), 300));
    
    
    inviteBtn.addEventListener('click', async () => {
        const selectedCheckboxes = searchResultsDropdown.querySelectorAll('.user-to-invite-checkbox:checked');
        const userIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.userId);

        if (userIds.length === 0) {
            alert('Selecione pelo menos um usuário para convidar.');
            return;
        }

        const response = await fetch(`/projeto/${projectId}/manage-collaborators/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
            body: JSON.stringify({ action: 'add', user_ids: userIds })
        });
        const data = await response.json();
        showStatusMessage(data.message, data.status === 'success');
        if (data.status === 'success') {
            // Mantemos o reload aqui, pois adicionar um novo membro
            // pode precisar de mais dados do que temos no frontend.
            setTimeout(() => window.location.reload(), 1500);
        }
    });

    memberListSearch.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        memberList.querySelectorAll('.access-list-item').forEach(item => {
            const name = item.querySelector('.user-name').textContent.toLowerCase();
            const type = item.dataset.userType;
            const nameMatch = name.includes(query);
            const typeMatch = (manageFilterType === 'all' || type === manageFilterType);
            item.style.display = (nameMatch && typeMatch) ? 'flex' : 'none';
        });
    });

    async function removeMembers() {
        const userIds = itemsToRemove.map(item => item.dataset.userId);
        if (userIds.length === 0) return;

        const response = await fetch(`/projeto/${projectId}/manage-collaborators/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
            body: JSON.stringify({ action: 'remove', user_ids: userIds })
        });
        const data = await response.json();
        showStatusMessage(data.message, data.status === 'success');

        // *** CORREÇÃO APLICADA AQUI ***
        if (data.status === 'success') {
            // Remove os itens da tela
            itemsToRemove.forEach(item => item.remove());
            closeModal(removeUserModal);
            
            // Atualiza a contagem de membros na tela
            const remainingCount = memberList.querySelectorAll('.access-list-item').length;
            memberCountSpan.textContent = remainingCount;
            
            // Esconde o botão "Remover selecionados"
            updateRemoveSelectedButton();
            if(selectAllCheckbox) selectAllCheckbox.checked = false;
        }
    }

    function updateRemoveSelectedButton() {
        if(!memberList) return;
        const checkedBoxes = memberList.querySelectorAll('.member-checkbox:checked');
        if(removeSelectedBtn) removeSelectedBtn.style.display = checkedBoxes.length > 0 ? 'inline-block' : 'none';
    }

    if (memberList) {
        memberList.addEventListener('change', (e) => {
            if (e.target.matches('.member-checkbox')) {
                updateRemoveSelectedButton();
            }
        });
    }

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            if(!memberList) return;
            memberList.querySelectorAll('.member-checkbox').forEach(cb => {
                cb.checked = selectAllCheckbox.checked;
            });
            updateRemoveSelectedButton();
        });
    }

    // O resto da sua lógica continua igual...
    memberList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            itemsToRemove = [e.target.closest('.access-list-item')];
            if(removeUserModal) removeUserModal.classList.add('visible');
        }
    });

    if(removeSelectedBtn){
        removeSelectedBtn.addEventListener('click', () => {
            itemsToRemove = [...memberList.querySelectorAll('.member-checkbox:checked')].map(cb => cb.closest('.access-list-item'));
            if (itemsToRemove.length > 0 && removeUserModal) removeUserModal.classList.add('visible');
        });
    }
    
    if(confirmRemoveBtn) confirmRemoveBtn.addEventListener('click', removeMembers);

    function closeModal(modal) {
        if (modal) modal.classList.remove('visible');
    }
    if(removeUserModal) removeUserModal.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', () => closeModal(removeUserModal)));
    
    if (searchResultsDropdown) {
        searchResultsDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    document.addEventListener('click', () => {
        if (searchResultsDropdown) searchResultsDropdown.style.display = 'none';
        if (inviteFilterMenu) inviteFilterMenu.classList.remove('visible');
        if (manageFilterMenu) manageFilterMenu.classList.remove('visible');
    });
}