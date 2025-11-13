document.addEventListener("DOMContentLoaded", () => {
    const botones = document.querySelectorAll(".btn-wishlist-toggle");

    botones.forEach(btn => {
        // Establecer el icono inicial basado en el estado
        const marcado = btn.getAttribute("aria-pressed") === "true";
        btn.textContent = marcado ? "❤️" : "🤍";

        btn.addEventListener("click", async () => {
            const productoId = btn.getAttribute("data-id");
            const marcado = btn.getAttribute("aria-pressed") === "true";

            if (!productoId) return; // si es link de login, salir

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
                    mostrarNotificacion("⚠️ Respuesta inesperada del servidor", "error");
                    return;
                }

                if (response.ok && data.success) {
                    // Cambiar el icono del corazón
                    if (marcado) {
                        btn.textContent = "🤍"; // Corazón blanco
                        btn.setAttribute("aria-pressed", "false");
                        mostrarNotificacion(`❌ ${data.mensaje}`, "error");
                    } else {
                        btn.textContent = "❤️"; // Corazón rojo
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

    // Función para obtener el token CSRF
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

    // 🔔 Función de notificación
    function mostrarNotificacion(msg, tipo = "success", conVerCarrito = false) {
        const noti = document.createElement("div");
        noti.className = "notificacion";
        noti.innerHTML = `<span class="mensaje">${msg}</span>`;

        // si quieres agregar un botón o link especial, puedes cambiar "Ver carrito" por otro texto
        if (conVerCarrito) {
            const a = document.createElement("a");
            a.href = "/wishlist/";
            a.innerText = " Ver wishlist";
            a.className = "ver-carrito";
            noti.appendChild(a);
        }

        if (tipo === "error") {
            noti.style.background = "#dc3545";
        }

        document.body.appendChild(noti);
        setTimeout(() => noti.classList.add("show"), 50);

        setTimeout(() => {
            noti.classList.remove("show");
            setTimeout(() => noti.remove(), 300);
        }, 3000);
    }
});