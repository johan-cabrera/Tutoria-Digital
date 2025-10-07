document.addEventListener('DOMContentLoaded', () => {
    // 2. Obtener el ID de la Sesión
    const sessionId = localStorage.getItem('currentSessionId');

    if (!sessionId) {
        console.error("ID de sesión no encontrado en localStorage. Redirigiendo a sesiones.");
        window.location.href = 'sesiones.html';
        return;
    }

    // 3. Referencias a los elementos del DOM
    const DOM = {
        title: document.getElementById('session-title'),
        grupos: document.getElementById('materia-grupos'),
        estudiantesActivos: document.getElementById('materia-estudiantes-activos'),
        docente: document.getElementById('materia-docente'),
        dias: document.getElementById('session-dias'),
        hora: document.getElementById('session-hora'),
        aula: document.getElementById('session-aula'),
    };

    /**
     * Función principal para cargar y actualizar todos los detalles de la sesión.
     * Ahora obtiene toda la lista de sesiones y filtra por el ID.
     */
    async function loadSessionDetails(id) {
        // Aseguramos que el ID de sesión sea un número para la comparación estricta (si es necesario)
        const targetId = parseInt(id); 

        // Función de error para la vista
        const displayError = (msg) => {
            if (DOM.title) DOM.title.textContent = "Error al cargar los datos de la sesión";
            Object.values(DOM).forEach(el => {
                if(el && el !== DOM.title) el.textContent = '—';
            });
            console.error(msg);
        };
        
        try {
            // 📢 CAMBIO CLAVE: Obtener TODAS las sesiones
            
            const allSessionsResponse = await fetch(`${API_BASE_URL}/sesiones`); 
            
            if (!allSessionsResponse.ok) {
                throw new Error("Error de red al obtener la lista completa de sesiones.");
            }
            
            const allSessions = await allSessionsResponse.json();

            // 📢 FILTRADO CLAVE: Buscar la sesión por ID en el cliente
            const session = allSessions.find(s => s.id == targetId);

            if (!session) {
                displayError(`Sesión con ID ${targetId} no encontrada en la base de datos.`);
                return;
            }

            // 4. Actualizar el DOM usando los datos directos de la sesión
            
            // Título
            if (DOM.title) DOM.title.textContent = session.materia;
            
            // Detalles de la Materia
            if (DOM.grupos) DOM.grupos.textContent = session.grupos || 'N/A';
            if (DOM.estudiantesActivos) DOM.estudiantesActivos.textContent = session.estudiantes_activos || 0;
            if (DOM.docente) DOM.docente.textContent = session.docente || 'No asignado';
            
            // Detalles de la Sesión
            if (DOM.dias) DOM.dias.textContent = session.dia || 'N/A';
            if (DOM.hora) DOM.hora.textContent = session.hora || 'N/A';
            if (DOM.aula) DOM.aula.textContent = session.aula || 'N/A';

            console.log("Detalles de sesión cargados con éxito:", session);

        } catch (error) {
            displayError(`Fallo en la operación: ${error.message}`);
        }
    }
    
    // Iniciar la carga
    loadSessionDetails(sessionId);
});