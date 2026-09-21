// Funcionalidades para la página de productos

document.addEventListener('DOMContentLoaded', function() {
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
    }

    init() {
        this.cargarProductos();
        this.setupFiltros();
        this.setupOrdenamiento();
        this.setupMenuHamburguesa();
    }

    cargarProductos() {
        this.productos = Array.from(document.querySelectorAll('.producto-card'));
    }

    setupFiltros() {
        this.filtros.forEach(filtro => {
            filtro.addEventListener('click', (e) => {
                e.preventDefault();
                const filtroSeleccionado = e.currentTarget.dataset.filter;
                this.aplicarFiltro(filtroSeleccionado);
            });
        });
    }

    aplicarFiltro(filtro) {
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
    }

    setupOrdenamiento() {
        if (this.ordenSelect) {
            this.ordenSelect.addEventListener('change', (e) => {
                this.ordenarProductos(e.target.value);
            });
        }
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

        // Limpiar y reinsertar productos ordenados
        productosVisibles.forEach(producto => {
            this.productosGrid.appendChild(producto);
        });
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
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        new ProductosManager().init();
    });
} else {
    new ProductosManager().init();
}
