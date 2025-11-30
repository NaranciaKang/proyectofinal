document.addEventListener("DOMContentLoaded", () => {
    const botones = document.querySelectorAll(".btn-wishlist-toggle");

    botones.forEach(btn => {
        const marcado = btn.getAttribute("aria-pressed") === "true";
        btn.textContent = marcado ? "❤️" : "🤍";

        btn.addEventListener("click", async (e) => {
            e.preventDefault(); 
            const productoId = btn.getAttribute("data-id");
            const marcado = btn.getAttribute("aria-pressed") === "true";

            if (!productoId) return;

            try {
                const url = marcado
                    ? `/wishlist/eliminar/${productoId}/`
                    : `/wishlist/agregar/${productoId}/`;

                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCookie("csrftoken"),
                        "X-Requested-With": "XMLHttpRequest",
                        "Accept": "application/json"
                    },
                    credentials: "same-origin"
                });

                let data;
                const text = await response.text();
                
                try {
                    data = text ? JSON.parse(text) : {};
                } catch (err) {
                    console.error("Respuesta no JSON:", text);
                    if (response.status === 403 || response.status === 302) {
                        window.location.reload();
                        return;
                    }
                    mostrarNotificacion("⚠️ Error inesperado del servidor", "error");
                    return;
                }

                if (response.ok) {
                    if (data.success) {
                        // Cambiar el icono del corazón
                        if (marcado) {
                            btn.textContent = "🤍";
                            btn.setAttribute("aria-pressed", "false");
                        } else {
                            btn.textContent = "❤️";
                            btn.setAttribute("aria-pressed", "true");
                        }
                        mostrarNotificacion(data.mensaje, "success");
                    } else {
                        //  ya está en wishlist
                        mostrarNotificacion(data.mensaje, "error");
                    }
                } else {
                    // Error al actualizar favoritos
                    const msg = data.mensaje || `❌ Error ${response.status} al actualizar favoritos`;
                    mostrarNotificacion(msg, "error");
                }

            } catch (err) {
                console.error("Error de red:", err);
                mostrarNotificacion("⚠️ Error de conexión", "error");
            }
        });
    });

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Función de notificación mejorada
    function mostrarNotificacion(msg, tipo = "success") {
        const notificacionesExistentes = document.querySelectorAll('.notificacion');
        notificacionesExistentes.forEach(noti => noti.remove());

        const noti = document.createElement("div");
        noti.className = `notificacion ${tipo === "error" ? "error" : ""}`;
        noti.innerHTML = `<span class="mensaje">${msg}</span>`;

        document.body.appendChild(noti);
        
        // Animación de entrada
        setTimeout(() => noti.classList.add("show"), 50);

        // eliminar después de 3 segundos
        setTimeout(() => {
            noti.classList.remove("show");
            setTimeout(() => {
                if (noti.parentNode) {
                    noti.parentNode.removeChild(noti);
                }
            }, 300);
        }, 3000);
    }
});