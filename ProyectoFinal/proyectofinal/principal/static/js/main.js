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
            this.modules.navbar = new NavbarManager();
            this.modules.userMenu = new UserMenuManager();
            this.modules.responsive = new ResponsiveHandler();
            
            console.log('✅ Todos los módulos inicializados correctamente');
        } catch (error) {
            console.error('❌ Error inicializando módulos:', error);
        }
    }

    bindGlobalEvents() {
        document.addEventListener('breakpointChange', (e) => {
            this.handleBreakpointChange(e.detail);
        });

        document.addEventListener('menuOpened', () => {
            if (this.modules.userMenu) {
                this.modules.userMenu.closeDropdown();
            }
        });

        this.setupLazyLoading();
    }

    handleBreakpointChange(detail) {
        console.log(`Breakpoint cambiado: ${detail.old} → ${detail.current}`);
        
        if (detail.isMobile && !detail.old.includes('xs') && !detail.old.includes('sm')) {
            this.optimizeForMobile();
        } else if (detail.isDesktop && !detail.old.includes('lg') && !detail.old.includes('xl')) {
            this.optimizeForDesktop();
        }
    }

    optimizeForMobile() {
        document.documentElement.style.setProperty('--touch-target', '44px');
    }

    optimizeForDesktop() {
        document.documentElement.style.setProperty('--touch-target', 'auto');
    }

    setupLazyLoading() {
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
        window.addEventListener('error', (e) => {
            console.error('Error global capturado:', e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Promesa rechazada no manejada:', e.reason);
            e.preventDefault();
        });
    }

    getModule(moduleName) {
        return this.modules[moduleName];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App };
}