// productos.js - Funcionalidades para la página de productos

class ProductosManager {
    constructor() {
        this.productosGrid = document.getElementById('productosGrid');
        this.filtros = document.querySelectorAll('.btn-filtro');
        this.ordenSelect = document.getElementById('ordenSelect');
        this.contadorProductos = document.querySelector('.contador-productos');
        this.productos = Array.from(document.querySelectorAll('.producto-card'));
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupWishlist();
        this.updateContador();
    }

    setupEventListeners() {
        // Filtros por categoría
        this.filtros.forEach(filtro => {
            filtro.addEventListener('click', (e) => {
                this.aplicarFiltro(e.target.dataset.filter);
            });
        });

        // Ordenamiento
        this.ordenSelect.addEventListener('change', (e) => {
            this.ordenarProductos(e.target.value);
        });

        // Menú hamburguesa
        this.setupMenuHamburguesa();
    }

    setupMenuHamburguesa() {
        const toggle = document.getElementById('menuToggle');
        const navList = document.querySelector('.nav-list');
        
        if (toggle && navList) {
            toggle.addEventListener('click', () => {
                navList.classList.toggle('show');
                toggle.classList.toggle('active');
            });

            // Cerrar menú al hacer clic en un enlace
            document.querySelectorAll('.nav-list a').forEach(link => {
                link.addEventListener('click', () => {
                    navList.classList.remove('show');
                    toggle.classList.remove('active');
                });
            });
        }
    }

    aplicarFiltro(filtro) {
        // Actualizar estado activo de botones
        this.filtros.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filtro) {
                btn.classList.add('active');
            }
        });

        let productosVisibles = 0;

        this.productos.forEach(producto => {
            if (filtro === 'todos' || producto.dataset.categoria === filtro) {
                producto.style.display = 'block';
                productosVisibles++;
            } else {
                producto.style.display = 'none';
            }
        });

        this.updateContador(productosVisibles);
    }

    ordenarProductos(criterio) {
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

        // Reordenar en el DOM
        productosVisibles.forEach(producto => {
            this.productosGrid.appendChild(producto);
        });
    }

    updateContador(cantidad = null) {
        if (cantidad === null) {
            cantidad = this.productos.length;
        }
        this.contadorProductos.textContent = `${cantidad} productos encontrados`;
    }

    setupWishlist() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-wishlist-toggle')) {
                this.toggleWishlist(e.target.closest('.btn-wishlist-toggle'));
            }
        });
    }

    async toggleWishlist(btnWishlist) {
        const productoId = btnWishlist.dataset.productoId;
        
        if (!productoId) return;

        // Feedback visual inmediato
        btnWishlist.classList.toggle('active');
        
        try {
            const response = await fetch(`/wishlist/agregar/${productoId}/`, {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': this.getCookie('csrftoken')
                }
            });

            const data = await response.json();

            if (!data.success) {
                // Revertir cambio visual si falla
                btnWishlist.classList.toggle('active');
                
                if (data.error && data.error.includes('Debes iniciar sesión')) {
                    window.location.href = '/login/';
                } else {
                    this.mostrarMensaje(data.mensaje || 'Error al actualizar wishlist', 'error');
                }
            } else {
                this.mostrarMensaje(data.mensaje, 'success');
            }
        } catch (error) {
            console.error('Error:', error);
            btnWishlist.classList.toggle('active');
            this.mostrarMensaje('Error de conexión', 'error');
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

    mostrarMensaje(mensaje, tipo = 'info') {
        // Crear elemento de mensaje
        const mensajeEl = document.createElement('div');
        mensajeEl.className = `mensaje-flotante mensaje-${tipo}`;
        mensajeEl.textContent = mensaje;
        mensajeEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        if (tipo === 'success') {
            mensajeEl.style.background = '#10b981';
        } else if (tipo === 'error') {
            mensajeEl.style.background = '#ef4444';
        } else {
            mensajeEl.style.background = '#3b82f6';
        }

        document.body.appendChild(mensajeEl);

        // Remover después de 3 segundos
        setTimeout(() => {
            mensajeEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (mensajeEl.parentNode) {
                    mensajeEl.parentNode.removeChild(mensajeEl);
                }
            }, 300);
        }, 3000);
    }
}

// Estilos CSS para animaciones de mensajes
const estiloMensajes = document.createElement('style');
estiloMensajes.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(estiloMensajes);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ProductosManager();
});

// Manejar envío de formularios de carrito
document.addEventListener('submit', async (e) => {
    if (e.target.classList.contains('form-agregar-carrito')) {
        e.preventDefault();
        
        const form = e.target;
        const button = form.querySelector('button[type="submit"]');
        const originalText = button.innerHTML;
        
        // Feedback visual
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
                // Mostrar mensaje de éxito
                const mensajeManager = new ProductosManager();
                mensajeManager.mostrarMensaje(data.mensaje || 'Producto agregado al carrito', 'success');
            } else {
                throw new Error(data.error || 'Error al agregar al carrito');
            }
        } catch (error) {
            console.error('Error:', error);
            const mensajeManager = new ProductosManager();
            mensajeManager.mostrarMensaje('Error al agregar al carrito', 'error');
        } finally {
            // Restaurar botón
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
});