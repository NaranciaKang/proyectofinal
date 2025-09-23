document.addEventListener("DOMContentLoaded", function() {
    const userIcon = document.getElementById("userIcon");
    const userDropdown = document.getElementById("userDropdown");

    if (userIcon && userDropdown) {
        userIcon.addEventListener("click", function(e) {
            e.stopPropagation(); // evitar que se cierre inmediatamente
            userDropdown.classList.toggle("show");
        });

        // Cerrar el menú si se hace clic fuera
        document.addEventListener("click", function(e) {
            if (!userDropdown.contains(e.target) && e.target !== userIcon) {
                userDropdown.classList.remove("show")
            }
        });
    }
});

