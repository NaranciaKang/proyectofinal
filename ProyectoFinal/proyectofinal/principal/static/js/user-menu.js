// user-menu.js - Gestión del menú desplegable del usuario

class UserMenuManager {
    constructor() {
        this.userMenu = document.querySelector('.user-menu');
        this.dropdown = document.getElementById('userDropdown');
        this.isOpen = false;
        
        if (this.userMenu) {
            this.init();
        }
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Toggle del dropdown
        this.userMenu.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', () => this.closeDropdown());
        
        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeDropdown();
            }
        });

        // Prevenir cierre al hacer clic dentro del dropdown
        this.dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        this.dropdown.style.display = 'block';
        this.isOpen = true;
        
        // Agregar clase activa
        this.userMenu.classList.add('active');
        
        // Disparar evento
        this.dispatchEvent('userMenuOpened');
    }

    closeDropdown() {
        this.dropdown.style.display = 'none';
        this.isOpen = false;
        
        // Remover clase activa
        this.userMenu.classList.remove('active');
        
        // Disparar evento
        this.dispatchEvent('userMenuClosed');
    }

    dispatchEvent(eventName) {
        const event = new CustomEvent(eventName, {
            detail: { isOpen: this.isOpen }
        });
        document.dispatchEvent(event);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new UserMenuManager();
});