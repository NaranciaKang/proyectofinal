document.addEventListener("DOMContentLoaded", () => {
    const botones = document.querySelectorAll(".btn-wishlist-toggle");

    botones.forEach(btn => {
        btn.addEventListener("click", async () => {
            const productoId = btn.getAttribute("data-id");
            const marcado = btn.getAttribute("aria-pressed") === "true";

            if (!productoId) return; // si es link de login, salir

            try {
                const url = marcado ? `/wishlist/eliminar/${productoId}/` : `/wishlist/agregar/${productoId}/`;
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
                    mostrarNotificacion("⚠️ Respuesta inesperada del servidor", "error");
                    return;
                }

                if (response.ok && data.success) {
                    // Toggle del corazón
                    if (marcado) {
                        btn.textContent = "🤍";
                        btn.setAttribute("aria-pressed", "false");
                        mostrarNotificacion(`❌ ${data.mensaje}`, "error");
                    } else {
                        btn.textContent = "❤️";
                        btn.setAttribute("aria-pressed", "true");
                        mostrarNotificacion(`✅ ${data.mensaje}`, "success");
                    }
                } else {
                    const msg = data.mensaje || "❌ Error al actualizar favoritos";
                    mostrarNotificacion(msg, "error");
                }

            } catch (err) {
                console.error(err);
                mostrarNotificacion("⚠️ Error de red o del servidor", "error");
            }
        });
    });

    // Función para obtener CSRF
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

    // Función de notificación pequeña
    function mostrarNotificacion(msg, tipo = "success") {
        const containerId = "notificaciones-container";

        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement("div");
            container.id = containerId;
            container.style.position = "fixed";
            container.style.top = "20px";
            container.style.right = "20px";
            container.style.zIndex = "9999";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.gap = "10px";
            document.body.appendChild(container);
        }

        const noti = document.createElement("div");
        noti.textContent = msg;
        noti.style.background = tipo === "success" ? "#28a745" : "#dc3545";
        noti.style.color = "white";
        noti.style.padding = "8px 12px";
        noti.style.borderRadius = "5px";
        noti.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
        noti.style.minWidth = "180px";
        noti.style.fontSize = "0.85rem";
        noti.style.opacity = "0";
        noti.style.transition = "0.3s";

        container.appendChild(noti);
        setTimeout(() => noti.style.opacity = "1", 50);
        setTimeout(() => {
            noti.style.opacity = "0";
            setTimeout(() => noti.remove(), 300);
        }, 2500);
    }
});
