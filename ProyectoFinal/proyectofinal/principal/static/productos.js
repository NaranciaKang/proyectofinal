// productos.js - Funcionalidades para la página de productos

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema de productos...');
    
    // Inicializar gestor de productos
    const productosManager = new ProductosManager();
    productosManager.init();
});

class ProductosManager {
    constructor() {
        this.productosGrid = document.getElementById('productosGrid');
        this.filtros = document.querySelectorAll('.btn-filtro');
        this.ordenSelect = document.getElementById('ordenSelect');
        this.contadorProductos = document.querySelector('.contador-productos');
        this.productos = [];
        
        console.log('📍 Elementos encontrados:');
        console.log('- productosGrid:', this.productosGrid);
        console.log('- filtros:', this.filtros.length);
        console.log('- ordenSelect:', this.ordenSelect);
        console.log('- contadorProductos:', this.contadorProductos);
    }

    init() {
        this.cargarProductos();
        this.setupFiltros();
        this.setupOrdenamiento();
        this.setupMenuHamburguesa();
        this.setupWishlist();
        this.setupCarrito();
    }

    cargarProductos() {
        this.productos = Array.from(document.querySelectorAll('.producto-card'));
        console.log('📦 Productos cargados:', this.productos.length);
        
        this.productos.forEach((producto, index) => {
            console.log(`Producto ${index + 1}:`, {
                nombre: producto.dataset.nombre,
                categoria: producto.dataset.categoria,
                precio: producto.dataset.precio,
                id: producto.dataset.id
            });
        });
    }

    setupFiltros() {
        console.log('🔧 Configurando filtros...');
        
        this.filtros.forEach(filtro => {
            filtro.addEventListener('click', (e) => {
                e.preventDefault();
                const filtroSeleccionado = e.currentTarget.dataset.filter;
                console.log('🎯 Filtro seleccionado:', filtroSeleccionado);
                this.aplicarFiltro(filtroSeleccionado);
            });
        });
    }

    aplicarFiltro(filtro) {
        console.log('🎛️ Aplicando filtro:', filtro);
        
        // Actualizar botones activos
        this.filtros.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filtro) {
                btn.classList.add('active');
            }
        });

        let visibleCount = 0;

        this.productos.forEach(producto => {
            const categoria = producto.dataset.categoria;
            
            if (filtro === 'todos' || categoria === filtro) {
                producto.style.display = 'block';
                producto.style.opacity = '1';
                visibleCount++;
            } else {
                producto.style.display = 'none';
            }
        });

        this.actualizarContador(visibleCount);
        console.log(`👀 Productos visibles: ${visibleCount}`);
    }

    setupOrdenamiento() {
        if (this.ordenSelect) {
            this.ordenSelect.addEventListener('change', (e) => {
                const criterio = e.target.value;
                console.log('📊 Orden seleccionado:', criterio);
                this.ordenarProductos(criterio);
            });
        }
    }

    ordenarProductos(criterio) {
        console.log('🔄 Ordenando productos por:', criterio);
        
        const productosVisibles = this.productos.filter(p => 
            p.style.display !== 'none'
        );

        productosVisibles.sort((a, b) => {
            switch(criterio) {
                case 'precio-asc':
                    return parseFloat(a.dataset.precio) - parseFloat(b.dataset.precio);
                case 'precio-desc':
                    return parseFloat(b.dataset.precio) - parseFloat(a.dataset.precio);
                case 'nombre':
                    return a.dataset.nombre.localeCompare(b.dataset.nombre);
                case 'nuevos':
                default:
                    return parseInt(b.dataset.id) - parseInt(a.dataset.id);
            }
        });

        // Limpiar y reinsertar productos ordenados
        productosVisibles.forEach(producto => {
            this.productosGrid.appendChild(producto);
        });

        console.log('✅ Productos ordenados');
    }

    actualizarContador(cantidad) {
        if (this.contadorProductos) {
            this.contadorProductos.textContent = `${cantidad} productos encontrados`;
        }
    }

    setupMenuHamburguesa() {
        const toggle = document.getElementById('menuToggle');
        const navList = document.querySelector('.nav-list');
        
        if (toggle && navList) {
            toggle.addEventListener('click', () => {
                navList.classList.toggle('show');
                toggle.classList.toggle('active');
            });

            document.querySelectorAll('.nav-list a').forEach(link => {
                link.addEventListener('click', () => {
                    navList.classList.remove('show');
                    toggle.classList.remove('active');
                });
            });
        }
    }

    setupWishlist() {
        document.addEventListener('click', (e) => {
            const wishlistBtn = e.target.closest('.btn-wishlist-toggle');
            if (wishlistBtn) {
                e.preventDefault();
                this.toggleWishlist(wishlistBtn);
            }
        });
    }

    async toggleWishlist(btn) {
        const productoId = btn.dataset.id;
        if (!productoId) return;

        const isActive = btn.getAttribute('aria-pressed') === 'true';
        
        try {
            const url = isActive 
                ? `/wishlist/eliminar/${productoId}/`
                : `/wishlist/agregar/${productoId}/`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': this.getCookie('csrftoken')
                }
            });

            const data = await response.json();

            if (data.success) {
                btn.setAttribute('aria-pressed', !isActive);
                btn.textContent = !isActive ? '❤️' : '🤍';
                this.mostrarNotificacion(data.mensaje, 'success');
            } else {
                throw new Error(data.mensaje);
            }
        } catch (error) {
            console.error('Error wishlist:', error);
            this.mostrarNotificacion('Error al actualizar favoritos', 'error');
        }
    }

    setupCarrito() {
        document.addEventListener('submit', async (e) => {
            if (e.target.classList.contains('form-agregar-carrito')) {
                e.preventDefault();
                await this.agregarAlCarrito(e.target);
            }
        });
    }

    async agregarAlCarrito(form) {
        const button = form.querySelector('button[type="submit"]');
        const originalText = button.innerHTML;
        
        button.innerHTML = '<span>Agregando...</span>';
        button.disabled = true;
        
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': form.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: new FormData(form)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.mostrarNotificacion(data.mensaje || 'Producto agregado al carrito', 'success');
            } else {
                throw new Error(data.error || 'Error al agregar al carrito');
            }
        } catch (error) {
            console.error('Error carrito:', error);
            this.mostrarNotificacion('Error al agregar al carrito', 'error');
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    getCookie(name) {
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

    mostrarNotificacion(mensaje, tipo) {
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo === 'error' ? 'error' : ''}`;
        notificacion.innerHTML = `<span class="mensaje">${mensaje}</span>`;
        
        document.body.appendChild(notificacion);
        
        setTimeout(() => notificacion.classList.add('show'), 50);
        setTimeout(() => {
            notificacion.classList.remove('show');
            setTimeout(() => notificacion.remove(), 300);
        }, 3000);
    }
}

// Fallback para asegurar que se inicialice
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🔄 Fallback: Inicializando desde evento DOMContentLoaded');
        new ProductosManager().init();
    });
} else {
    console.log('⚡ Fallback: Inicializando inmediatamente (DOM ya listo)');
    new ProductosManager().init();
}