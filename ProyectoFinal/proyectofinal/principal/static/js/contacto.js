//formulario de contacto

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando formulario de contacto...');
    
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
    
    // Mostrar estado de carga
    boton.innerHTML = 'Enviando...';
    boton.classList.add('loading');
    boton.disabled = true;
    
    
    setTimeout(() => {  
        mostrarMensaje('✅ Mensaje enviado correctamente. Te contactaremos pronto.', 'exito');
        boton.innerHTML = originalText;
        boton.classList.remove('loading');
        boton.disabled = false;
        
        // Limpiar formulario
        formulario.reset();
        
    }, 2000);
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