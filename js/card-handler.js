// js/card-handler.js

(function() {
    /**
     * Módulo autoejecutable para manejar los clics en las tarjetas de sesión.
     * Utiliza la delegación de eventos para un rendimiento óptimo.
     */
    
    // El nombre clave que usaremos en localStorage para guardar el ID de la sesión
    const SESSION_ID_STORAGE_KEY = 'currentSessionId';

    document.addEventListener('click', (event) => {
        // 1. Encontrar el elemento de la tarjeta más cercano al punto del click.
        // Buscamos un elemento que tenga el atributo data-id, asegurándonos de que sea una tarjeta interactiva.
        const cardElement = event.target.closest('.cursor-pointer[data-id]');

        // 2. Verificar si es una tarjeta activa (identificada por el data-id y cursor-pointer)
        if (cardElement) {
            
            const sessionId = cardElement.getAttribute('data-id');
            
            if (sessionId) {
                // 3. Guardar el ID de la sesión en localStorage
                // Esto permite que 'sesion.html' lo lea al cargarse.
                localStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);

                // 4. Redirigir a la vista de detalle
                // Como los scripts están en la carpeta 'js' y las vistas en 'pages', la ruta debe ser relativa.
                // Si estamos en pages/inicio.html o pages/sesiones.html, la ruta correcta es:
                window.location.href = 'sesion.html';
            }
        }
    });

    console.log("Card Handler activo: Listo para detectar clics en tarjetas de sesión.");
})();