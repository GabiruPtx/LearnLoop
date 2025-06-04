document.addEventListener('DOMContentLoaded', function() {
    // Código para alternar visibilidade de senhas
    const passwordInputs = document.querySelectorAll('.password-container input[type="password"]');
    const togglePasswordButtons = document.querySelectorAll('.password-container .toggle-password');

    togglePasswordButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            const passwordInput = passwordInputs[index];
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            const currentSrc = this.getAttribute('src');
            const newSrc = currentSrc.includes('Eye%20off.svg') ? eyeOpenSrc : eyeClosedSrc;
            this.setAttribute('src', newSrc);
        });
    });

    // --- Início do código JS para as abas ---
    const tabsMenu = document.getElementById('tabsMenu');
    console.log('tabsMenu encontrado:', tabsMenu); // Verifica se tabsMenu é encontrado

    if (tabsMenu) {
        const tabs = tabsMenu.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        console.log('Total de abas encontradas:', tabs.length); // Quantas abas encontrou
        console.log('Total de conteúdos de abas encontrados:', tabContents.length); // Quantos conteúdos encontrou

        tabs.forEach(tab => {
            console.log('Adicionando listener à aba:', tab); // Confirma que o listener está sendo adicionado
            tab.addEventListener('click', function() {
                console.log('Aba clicada:', this.dataset.tab); // Qual aba foi clicada

                // Remove a classe 'active' de todas as abas
                tabs.forEach(item => {
                    item.classList.remove('active');
                    console.log('Removido active de:', item);
                });
                // Adiciona a classe 'active' à aba clicada
                this.classList.add('active');
                console.log('Adicionado active a:', this);

                // Esconde todo o conteúdo das abas
                tabContents.forEach(content => {
                    content.classList.remove('active-content');
                    console.log('Removido active-content de:', content.id);
                });

                // Obtém o ID do conteúdo correspondente
                const targetTabId = this.dataset.tab;
                const targetContent = document.getElementById(`content-${targetTabId}`);
                console.log('Tentando mostrar conteúdo:', `content-${targetTabId}`, targetContent); // Vê se o conteúdo é encontrado

                // Mostra o conteúdo da aba clicada
                if (targetContent) {
                    targetContent.classList.add('active-content');
                    console.log('Conteúdo mostrado:', targetContent.id);
                } else {
                    console.warn(`Conteúdo com ID 'content-${targetTabId}' não encontrado.`);
                }
            });
        });
    } else {
        console.error('Elemento com ID "tabsMenu" não encontrado. O JS das abas não será inicializado.');
    }
    // --- Fim do código JS para as abas ---
});