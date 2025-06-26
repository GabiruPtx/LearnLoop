export function quickAccessMenu() {
    const menuButton = document.querySelector('.menuButton');
    const quickAccessMenu = document.getElementById('quick-access-menu');
    const overlay = document.getElementById('overlay');

    if (!menuButton || !quickAccessMenu || !overlay) {
        return;
    }

    const openMenu = () => {
        const rect = menuButton.getBoundingClientRect();
        quickAccessMenu.style.top = `${rect.bottom + 10}px`;
        quickAccessMenu.style.left = `${rect.left}px`;
        quickAccessMenu.style.display = 'block';
        setTimeout(() => {
            quickAccessMenu.style.opacity = '1';
        }, 10);
        overlay.classList.add('active');
        document.addEventListener('click', closeMenuOnClickOutside, true);
    };

    const closeMenu = () => {
        quickAccessMenu.style.opacity = '0';
        setTimeout(() => {
            quickAccessMenu.style.display = 'none';
            // Só remove o overlay se nenhum outro menu ou modal estiver ativo
            if (!document.querySelector('.project-menu-dropdown.active') && !document.querySelector('.modal.active')) {
                overlay.classList.remove('active');
            }
        }, 200);
        document.removeEventListener('click', closeMenuOnClickOutside, true);
    };

    const closeMenuOnClickOutside = (event) => {
        if (!quickAccessMenu.contains(event.target) && !menuButton.contains(event.target)) {
            closeMenu();
        }
    };

    menuButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const isMenuOpen = quickAccessMenu.style.display === 'block';
        if (isMenuOpen) {
            closeMenu();
        } else {
            // Fecha outros menus que possam estar abertos
            document.querySelectorAll('.project-menu-dropdown.active').forEach(menu => {
                menu.classList.remove('active');
            });
            openMenu();
        }
    });

    overlay.addEventListener('click', closeMenu);
}