document.addEventListener("DOMContentLoaded", () => {
const form = document.getElementById("form-pago");
if (form) {
    form.addEventListener("submit", () => {
    alert("Redirigiendo a Webpay...");
    });
}
});
