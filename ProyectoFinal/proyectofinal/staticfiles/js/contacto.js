//formulario de contacto

document.addEventListener('DOMContentLoaded', function() {
    const formulario = document.querySelector('.form-contacto');
    const botonEnviar = formulario.querySelector('.btn-gold');

    formulario.addEventListener('submit', function(e) {
        e.preventDefault();
        enviarFormulario(formulario, botonEnviar);
    });

    setupMenuHamburguesa();
});

function enviarFormulario(formulario, boton) {
    const formData = new FormData(formulario);
    const originalText = boton.innerHTML;

    boton.innerHTML = 'Enviando...';
    boton.classList.add('loading');
    boton.disabled = true;

    fetch(formulario.action || window.location.pathname, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                mostrarMensaje('Mensaje enviado correctamente. Te contactaremos pronto.', 'exito');
                formulario.reset();
            } else {
                mostrarMensaje(data.error || 'No se pudo enviar tu mensaje. Intenta nuevamente.', 'error');
            }
        })
        .catch(() => {
            mostrarMensaje('Error de conexión. Intenta nuevamente.', 'error');
        })
        .finally(() => {
            boton.innerHTML = originalText;
            boton.classList.remove('loading');
            boton.disabled = false;
        });
}

function mostrarMensaje(mensaje, tipo) {
    const mensajesAnteriores = document.querySelectorAll('.mensaje-exito, .mensaje-error');
    mensajesAnteriores.forEach(msg => msg.remove());

    const mensajeDiv = document.createElement('div');
    mensajeDiv.className = tipo === 'exito' ? 'mensaje-exito' : 'mensaje-error';
    mensajeDiv.textContent = mensaje;

    const formulario = document.querySelector('.form-contacto');
    formulario.parentNode.insertBefore(mensajeDiv, formulario);

    setTimeout(() => {
        mensajeDiv.remove();
    }, 5000);
}

function setupMenuHamburguesa() {
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
