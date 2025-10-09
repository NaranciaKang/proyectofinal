document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".form-agregar-carrito").forEach(form => {
        form.addEventListener("submit", async function(e) {
            e.preventDefault();

            const url = this.action;
            const csrfToken = this.querySelector("[name=csrfmiddlewaretoken]").value;

            try {
                const res = await fetch(url, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": csrfToken,
                        "X-Requested-With": "XMLHttpRequest",
                        "Accept": "application/json"
                    },
                    credentials: "same-origin" // importante para enviar cookies
                });

                // Intentamos parsear JSON; si no es JSON, mostramos error controlado
                let data;
                const text = await res.text();
                try {
                    data = text ? JSON.parse(text) : {};
                } catch (err) {
                    console.error("Respuesta no JSON:", text);
                    mostrarNotificacion("⚠️ Respuesta inesperada del servidor", "error");
                    return;
                }

                if (res.ok && data.success) {
                    mostrarNotificacion(`✅ ${data.mensaje}`, "success", true);
                } else {
                    // Si el servidor devolvió JSON pero con success false:
                    const msg = data.mensaje || "❌ Error al agregar el producto";
                    mostrarNotificacion(msg, "error");
                }

            } catch (err) {
                console.error(err);
                mostrarNotificacion("⚠️ Error de red o del servidor", "error");
            }
        });
    });

    function mostrarNotificacion(msg, tipo = "success", conVerCarrito = false) {
        const noti = document.createElement("div");
        noti.className = "notificacion";
        noti.innerHTML = `<span class="mensaje">${msg}</span>`;

        if (conVerCarrito) {
            const a = document.createElement("a");
            a.href = "/carrito/"; // si estás renderizando este JS desde template, o reemplaza por '/carrito/'
            a.innerText = " Ver carrito";
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
