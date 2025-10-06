document.addEventListener('DOMContentLoaded', () => {
    const sessionString = localStorage.getItem('currentUserSession');
    const sessionsContainer = document.getElementById('sessions');
    const welcomeNameElement = document.getElementById('welcomeName');
    
    let currentUserId = null;

    // --- Parte 1: Carga de Sesión y Actualización de UI ---

    if (sessionString) {
        try {
            const sessionData = JSON.parse(sessionString);
            currentUserId = sessionData.id_usuario;

            // Actualizar nombre en el saludo
            const firstName = sessionData.nombre_completo.split(' ')[0];
            if (welcomeNameElement) {
                welcomeNameElement.textContent = firstName;
            }
            
            // Llamar a la función para cargar y mostrar las sesiones
            if (sessionsContainer && currentUserId) {
                loadUserSessions(currentUserId);
            }

        } catch (error) {
            console.error('Error al cargar datos de sesión:', error);
            // Manejo de error de sesión (redirigir, limpiar localStorage, etc.)
        }
    }


    // --- Parte 2: Lógica de Carga y Renderizado de Sesiones ---

    /**
     * Calcula la fecha de la próxima sesión (o "Hoy").
     * @param {string} sessionDay - El día de la sesión ("Lunes", "Martes", etc.).
     * @returns {string} La fecha formateada o "Hoy".
     */

    function calculateNextDate(sessionDay) {
        const daysMap = {
            'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4, 'viernes': 5, 'sábado': 6
        };
        const dayIndex = daysMap[sessionDay.toLowerCase()];
        if (dayIndex === undefined) return 'Fecha no definida';

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalizar a medianoche

        // Comprobar si es "Hoy"
        if (today.getDay() === dayIndex) {
            return 'Hoy';
        }

        // Calcular la fecha de la próxima ocurrencia
        let nextDate = new Date(today);
        nextDate.setDate(today.getDate() + (dayIndex + 7 - today.getDay()) % 7);

        // Formato: "20 Ago 2025" 
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        // Usamos 'es-ES' para asegurar el formato de mes corto en español
        return nextDate.toLocaleDateString('es-ES', options).replace('.', ''); // Quitamos el punto del mes corto
    }

    /**
     * Genera el HTML para una sola tarjeta de sesión.
     * @param {object} session - Objeto de la sesión.
     * @param {string} nextDate - Fecha calculada ("Hoy" o la fecha formateada).
     */
    function createSessionCard(session, nextDate) {
        // La estructura de la tarjeta que tenías en el HTML
        return `
            <div class="bg-white p-7 rounded-lg shadow-sm border cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg hover:border-primary-blue" data-id="${session.id_sesion}">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-semibold text-text-dark">${session.materia}</h3>
                    <span class="text-md text-text-dark">${nextDate}</span>
                </div>
                <div class="space-y-2 text-lg">
                    <div class="flex items-center text-text-dark">
                        <i class="ti ti-map-pin text-primary-blue text-lg mr-2"></i>
                        <span>${session.aula}</span>
                    </div>
                    <div class="flex items-center text-text-dark">
                        <i class="ti ti-clock-hour-3 text-primary-blue text-lg mr-2"></i>
                        <span>${session.hora}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Carga, filtra y renderiza las sesiones en el DOM.
     * @param {number} userId - El id_usuario para filtrar las sesiones (id_tutor).
     */
    async function loadUserSessions(userId) {
        try {
            // 1. Cargar el JSON de sesiones
            const API_BASE_URL = 'https://tutoria-digital.onrender.com';
            const response = await fetch(`${API_BASE_URL}/sesiones`); 
            if (!response.ok) {
                throw new Error(`Error al cargar sesiones: ${response.statusText}`);
            }
            const allSessions = await response.json();

            // 2. Filtrar las sesiones por el id_tutor
            const userSessions = allSessions.filter(session => 
                session.id_tutor === userId && session.estado === 'activa');

            if (userSessions.length === 0) {
                sessionsContainer.innerHTML = '<p class="text-lg text-text-light">No tienes sesiones programadas próximamente.</p>';
                return;
            }

            // 3. Generar el HTML
            let sessionsHtml = userSessions.map(session => {
                const nextDate = calculateNextDate(session.dia);
                return createSessionCard(session, nextDate);
            }).join('');

            // 4. Insertar en el contenedor
            sessionsContainer.innerHTML = sessionsHtml;

        } catch (error) {
            console.error('Error al cargar o renderizar las sesiones:', error);
            sessionsContainer.innerHTML = '<p class="text-lg text-red-600">Error al cargar la lista de sesiones.</p>';
        }
    }
});