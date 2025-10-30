// responsive-handler.js - Manejo de comportamientos responsive

class ResponsiveHandler {
    constructor() {
        this.currentBreakpoint = this.getCurrentBreakpoint();
        this.init();
    }

    init() {
        this.bindEvents();
        this.handleInitialState();
    }

    bindEvents() {
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('orientationchange', () => this.handleOrientationChange());
    }

    getCurrentBreakpoint() {
        const width = window.innerWidth;
        
        if (width < 576) return 'xs';
        if (width < 768) return 'sm';
        if (width < 992) return 'md';
        if (width < 1200) return 'lg';
        return 'xl';
    }

    handleResize() {
        const newBreakpoint = this.getCurrentBreakpoint();
        
        if (newBreakpoint !== this.currentBreakpoint) {
            const oldBreakpoint = this.currentBreakpoint;
            this.currentBreakpoint = newBreakpoint;
            
            this.dispatchBreakpointChange(oldBreakpoint, newBreakpoint);
        }
        
        this.dispatchEvent('resize', { breakpoint: this.currentBreakpoint });
    }

    handleOrientationChange() {
        setTimeout(() => {
            this.handleResize();
        }, 100);
    }

    handleInitialState() {
        // Ajustes iniciales basados en el breakpoint
        this.applyBreakpointSpecificStyles();
    }

    applyBreakpointSpecificStyles() {
        // Aquí puedes agregar estilos específicos por breakpoint
        const breakpoint = this.currentBreakpoint;
        
        switch(breakpoint) {
            case 'xs':
            case 'sm':
                this.enableTouchInteractions();
                break;
            case 'md':
            case 'lg':
            case 'xl':
                this.enableHoverInteractions();
                break;
        }
    }

    enableTouchInteractions() {
        // Optimizar para touch
        document.body.classList.add('touch-device');
        document.body.classList.remove('hover-device');
    }

    enableHoverInteractions() {
        // Optimizar para hover
        document.body.classList.add('hover-device');
        document.body.classList.remove('touch-device');
    }

    dispatchBreakpointChange(oldBreakpoint, newBreakpoint) {
        const event = new CustomEvent('breakpointChange', {
            detail: {
                old: oldBreakpoint,
                current: newBreakpoint,
                isMobile: this.isMobile(),
                isTablet: this.isTablet(),
                isDesktop: this.isDesktop()
            }
        });
        document.dispatchEvent(event);
        
        // Aplicar estilos específicos del nuevo breakpoint
        this.applyBreakpointSpecificStyles();
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    isMobile() {
        return this.currentBreakpoint === 'xs' || this.currentBreakpoint === 'sm';
    }

    isTablet() {
        return this.currentBreakpoint === 'md';
    }

    isDesktop() {
        return this.currentBreakpoint === 'lg' || this.currentBreakpoint === 'xl';
    }

    // Métodos públicos para verificar el estado actual
    getBreakpoint() {
        return this.currentBreakpoint;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ResponsiveHandler();
});