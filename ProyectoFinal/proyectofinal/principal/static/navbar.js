// navbar.js - Gestión del menú responsive y navegación

class NavbarManager {
    constructor() {
        this.toggle = document.getElementById('menuToggle');
        this.navContainer = document.querySelector('.nav-container');
        this.body = document.body;
        this.isOpen = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.handleResize();
    }

    bindEvents() {
        // Toggle del menú hamburguesa
        this.toggle.addEventListener('click', () => this.toggleMenu());
        
        // Cerrar menú al hacer clic en enlaces
        document.querySelectorAll('.nav-list a, .icons a').forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        
        // Cerrar menú con Escape
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Manejar redimensionamiento de ventana
        window.addEventListener('resize', () => this.handleResize());
    }

    toggleMenu() {
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            this.openMenu();
        } else {
            this.closeMenu();
        }
    }

    openMenu() {
        this.navContainer.classList.add('active');
        this.toggle.classList.add('active');
        this.body.style.overflow = 'hidden';
        
        // Agregar overlay
        this.createOverlay();
        
        // Disparar evento personalizado
        this.dispatchEvent('menuOpened');
    }

    closeMenu() {
        this.navContainer.classList.remove('active');
        this.toggle.classList.remove('active');
        this.body.style.overflow = '';
        this.isOpen = false;
        
        // Remover overlay
        this.removeOverlay();
        
        // Disparar evento personalizado
        this.dispatchEvent('menuClosed');
    }

    createOverlay() {
        if (document.getElementById('nav-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'nav-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 998;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(overlay);
        
        // Animar overlay
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        // Cerrar menú al hacer clic en overlay
        overlay.addEventListener('click', () => this.closeMenu());
    }

    removeOverlay() {
        const overlay = document.getElementById('nav-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    }

    handleOutsideClick(e) {
        if (!this.isOpen) return;
        
        const isClickInsideNav = e.target.closest('.nav-container');
        const isClickOnToggle = e.target.closest('.menu-toggle');
        const isClickOnLogo = e.target.closest('.logo');
        
        if (!isClickInsideNav && !isClickOnToggle && !isClickOnLogo) {
            this.closeMenu();
        }
    }

    handleKeydown(e) {
        if (e.key === 'Escape' && this.isOpen) {
            this.closeMenu();
        }
    }

    handleResize() {
        // Cerrar menú si se redimensiona a desktop
        if (window.innerWidth > 992 && this.isOpen) {
            this.closeMenu();
        }
    }

    dispatchEvent(eventName) {
        const event = new CustomEvent(eventName, {
            detail: { isOpen: this.isOpen }
        });
        document.dispatchEvent(event);
    }

    // Método público para cerrar menú desde otros scripts
    close() {
        this.closeMenu();
    }

    // Método público para abrir menú desde otros scripts
    open() {
        this.openMenu();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new NavbarManager();
    
    // Agregar estilos para el overlay
    const styles = `
        @media (max-width: 992px) {
            .nav-container {
                transition: right 0.3s ease;
            }
            
            #nav-overlay {
                transition: opacity 0.3s ease;
            }
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
});