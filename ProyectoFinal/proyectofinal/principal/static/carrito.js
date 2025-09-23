document.addEventListener("DOMContentLoaded", () => {
    const totalFinal = document.getElementById("total-final");

    function actualizarTotal() {
        let total = 0;
        document.querySelectorAll(".subtotal").forEach(sub => {
            total += parseFloat(sub.innerText.replace("$", "")) || 0;
        });
        totalFinal.innerText = "$" + total.toFixed(0);
    }

    // Actualizar cantidades con AJAX
    document.querySelectorAll(".cantidad").forEach(input => {
        input.addEventListener("change", () => {
            let itemId = input.dataset.id;
            let cantidad = input.value;

            fetch("/actualizar-cantidad/", {
                method: "POST",
                headers: { "X-CSRFToken": getCookie("csrftoken"), "Content-Type": "application/x-www-form-urlencoded" },
                body: `item_id=${itemId}&cantidad=${cantidad}`
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    input.closest("tr").querySelector(".subtotal").innerText = "$" + data.subtotal;
                    actualizarTotal();
                }
            });
        });
    });

    // Eliminar producto con AJAX
    document.querySelectorAll(".btn-eliminar").forEach(btn => {
        btn.addEventListener("click", () => {
            let itemId = btn.dataset.id;
            fetch("/eliminar-item/", {
                method: "POST",
                headers: { "X-CSRFToken": getCookie("csrftoken"), "Content-Type": "application/x-www-form-urlencoded" },
                body: `item_id=${itemId}`
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    btn.closest("tr").remove();
                    actualizarTotal();
                }
            });
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

    actualizarTotal();
});
