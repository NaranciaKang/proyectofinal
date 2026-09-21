document.addEventListener("DOMContentLoaded", () => {
    const userIcon = document.getElementById("userIcon");
    const userMenu = userIcon ? userIcon.closest(".user-menu") : null;

    if (userIcon && userMenu) {
        // Mostrar / ocultar al hacer clic
        userIcon.addEventListener("click", (e) => {
            e.preventDefault();
            userMenu.classList.toggle("active");
        });

        // Cerrar si se hace clic fuera
        document.addEventListener("click", (e) => {
            if (!userMenu.contains(e.target)) {
                userMenu.classList.remove("active");
            }
        });
    }
});