
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
        // menú hamburguesa
        this.toggle.addEventListener('click', () => this.toggleMenu());
        
        // Cerrar menú al hacer clic en enlaces
        document.querySelectorAll('.nav-list a, .icons a').forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });

        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
        
        // Cerrar menú con Escape
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
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
        
        this.createOverlay();
        
        this.dispatchEvent('menuOpened');
    }

    closeMenu() {
        this.navContainer.classList.remove('active');
        this.toggle.classList.remove('active');
        this.body.style.overflow = '';
        this.isOpen = false;
        
        this.removeOverlay();
        
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
        
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
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

    close() {
        this.closeMenu();
    }

    open() {
        this.openMenu();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new NavbarManager();
    
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