document.addEventListener("DOMContentLoaded", () => {
    const totalFinal = document.getElementById("total-final");
    const btnComprar = document.querySelector('.btn-comprar');

    function actualizarTotal() {
        let total = 0;
        document.querySelectorAll(".subtotal").forEach(sub => {
            total += parseFloat(sub.innerText.replace("$", "")) || 0;
        });
        totalFinal.innerText = "$" + total.toFixed(0);
        
        // Mostrar/ocultar botón de comprar según si hay items
        const itemsCount = document.querySelectorAll(".producto-card").length;
        const carritoVacio = document.querySelector(".carrito-vacio");
        
        if (itemsCount === 0) {
            // No hay productos, mostrar carrito vacío
            if (btnComprar) {
                btnComprar.innerHTML = '<button class="btn btn-secondary" style="width: 100%;" disabled>Carrito Vacío</button>';
            }
        } else if (btnComprar && total > 0) {
            // Hay items, mostrar botón normal
            btnComprar.innerHTML = '<button class="btn btn-warning" style="width: 100%;">Comprar</button>';
        }
    }

    // Actualizar cantidades con AJAX
    document.querySelectorAll(".cantidad").forEach(input => {
        input.addEventListener("change", () => {
            let itemId = input.dataset.id;
            let cantidad = parseInt(input.value);

            if (cantidad < 1) {
                input.value = 1;
                cantidad = 1;
            }

            fetch("/actualizar-cantidad/", {
                method: "POST",
                headers: { 
                    "X-CSRFToken": getCookie("csrftoken"), 
                    "Content-Type": "application/x-www-form-urlencoded" 
                },
                body: `item_id=${itemId}&cantidad=${cantidad}`
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Encuentra el elemento subtotal en la misma tarjeta
                    const productoCard = input.closest(".producto-card");
                    const subtotalElement = productoCard.querySelector(".subtotal");
                    subtotalElement.innerText = "$" + data.subtotal;
                    actualizarTotal();
                    
                    // Mostrar notificación
                    mostrarNotificacion("✅ Cantidad actualizada", "success");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                mostrarNotificacion("❌ Error al actualizar cantidad", "error");
            });
        });
    });

    // Eliminar producto con AJAX
    document.querySelectorAll(".btn-eliminar").forEach(btn => {
        btn.addEventListener("click", () => {
            let itemId = btn.dataset.id;
            
            if (!confirm("¿Estás seguro de eliminar este producto del carrito?")) {
                return;
            }

            fetch("/eliminar-item/", {
                method: "POST",
                headers: { 
                    "X-CSRFToken": getCookie("csrftoken"), 
                    "Content-Type": "application/x-www-form-urlencoded" 
                },
                body: `item_id=${itemId}`
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Eliminar la tarjeta del producto
                    const productoCard = btn.closest(".producto-card");
                    productoCard.remove();
                    actualizarTotal();
                    mostrarNotificacion("✅ Producto eliminado del carrito", "success");

                    // Si no quedan productos, mostrar el mensaje de carrito vacío
                    if (document.querySelectorAll(".producto-card").length === 0) {
                        document.querySelector(".lista-productos").innerHTML = `
                            <div class="carrito-vacio">
                                <i class="fas fa-shopping-cart"></i>
                                <h3>Tu carrito está vacío</h3>
                                <p>Agrega productos para continuar con tu compra</p>
                                <a href="#" class="btn-seguir-comprando">Seguir Comprando</a>
                            </div>
                        `;
                    }
                } else {
                    mostrarNotificacion("❌ Error al eliminar producto", "error");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                mostrarNotificacion("❌ Error de conexión", "error");
            });
        });
    });

    // Funcionalidad para los botones de incremento/decremento
    document.querySelectorAll(".btn-cantidad.sumar").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = btn.parentElement.querySelector(".cantidad");
            let cantidad = parseInt(input.value) + 1;
            input.value = cantidad;
            
            // Disparar el evento change para actualizar automáticamente
            const event = new Event('change');
            input.dispatchEvent(event);
        });
    });

    document.querySelectorAll(".btn-cantidad.restar").forEach(btn => {
        btn.addEventListener("click", () => {
            const input = btn.parentElement.querySelector(".cantidad");
            let cantidad = parseInt(input.value) - 1;
            
            if (cantidad < 1) cantidad = 1;
            input.value = cantidad;
            
            // Disparar el evento change para actualizar automáticamente
            const event = new Event('change');
            input.dispatchEvent(event);
        });
    });

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === name + "=") {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function mostrarNotificacion(mensaje, tipo = "success") {
        // Crear notificación si no existe
        let notificacion = document.querySelector('.notificacion-carrito');
        if (!notificacion) {
            notificacion = document.createElement('div');
            notificacion.className = 'notificacion-carrito';
            document.body.appendChild(notificacion);
        }
        
        notificacion.textContent = mensaje;
        notificacion.className = `notificacion-carrito ${tipo}`;
        notificacion.style.display = 'block';
        
        setTimeout(() => {
            notificacion.style.display = 'none';
        }, 3000);
    }

    actualizarTotal();
});