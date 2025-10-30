// main.js - Script principal que inicializa todos los módulos

class App {
    constructor() {
        this.modules = {};
        this.init();
    }

    init() {
        this.initializeModules();
        this.bindGlobalEvents();
        this.setupErrorHandling();
    }

    initializeModules() {
        try {
            // Inicializar módulos
            this.modules.navbar = new NavbarManager();
            this.modules.userMenu = new UserMenuManager();
            this.modules.responsive = new ResponsiveHandler();
            
            console.log('✅ Todos los módulos inicializados correctamente');
        } catch (error) {
            console.error('❌ Error inicializando módulos:', error);
        }
    }

    bindGlobalEvents() {
        // Escuchar eventos personalizados entre módulos
        document.addEventListener('breakpointChange', (e) => {
            this.handleBreakpointChange(e.detail);
        });

        document.addEventListener('menuOpened', () => {
            // Cerrar otros menús cuando se abre el navbar
            if (this.modules.userMenu) {
                this.modules.userMenu.closeDropdown();
            }
        });

        // Manejar carga perezosa de imágenes
        this.setupLazyLoading();
    }

    handleBreakpointChange(detail) {
        console.log(`Breakpoint cambiado: ${detail.old} → ${detail.current}`);
        
        // Ajustes específicos cuando cambia el breakpoint
        if (detail.isMobile && !detail.old.includes('xs') && !detail.old.includes('sm')) {
            this.optimizeForMobile();
        } else if (detail.isDesktop && !detail.old.includes('lg') && !detail.old.includes('xl')) {
            this.optimizeForDesktop();
        }
    }

    optimizeForMobile() {
        // Optimizaciones específicas para móvil
        document.documentElement.style.setProperty('--touch-target', '44px');
    }

    optimizeForDesktop() {
        // Optimizaciones específicas para desktop
        document.documentElement.style.setProperty('--touch-target', 'auto');
    }

    setupLazyLoading() {
        // Configurar Intersection Observer para lazy loading
        if ('IntersectionObserver' in window) {
            const lazyImageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const lazyImage = entry.target;
                        lazyImage.src = lazyImage.dataset.src;
                        lazyImage.classList.remove('lazy');
                        lazyImageObserver.unobserve(lazyImage);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                lazyImageObserver.observe(img);
            });
        }
    }

    setupErrorHandling() {
        // Manejo global de errores
        window.addEventListener('error', (e) => {
            console.error('Error global capturado:', e.error);
        });

        // Manejo de promesas rechazadas
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Promesa rechazada no manejada:', e.reason);
            e.preventDefault();
        });
    }

    // Método público para obtener módulos
    getModule(moduleName) {
        return this.modules[moduleName];
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Exportar para uso en otros módulos (si se usa ES6 modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App };
}