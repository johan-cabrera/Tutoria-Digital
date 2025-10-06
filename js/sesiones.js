document.addEventListener('DOMContentLoaded', () => {
    // 2. Referencias a los contenedores
    const activeSessionsContainer = document.getElementById('active-sessions');
    const inactiveSessionsContainer = document.getElementById('inactive-sessions');
    
    // 3. Obtener el ID del usuario actual
    const sessionString = localStorage.getItem('currentUserSession');
    let currentUserId = null;
    if (sessionString) {
        try {
            currentUserId = JSON.parse(sessionString).id_usuario;
        } catch (error) {
            console.error("Error al obtener ID de usuario:", error);
            return; 
        }
    } else {
        // Redirigir al login si no hay sesión
        // window.location.href = '../index.html';
        return;
    }

    // --- Lógica de Fecha (Replicada/Incluida para independencia) ---
    function calculateNextDate(sessionDay) {
        const daysMap = {
            'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4, 'viernes': 5, 'sábado': 6
        };
        const dayIndex = daysMap[sessionDay.toLowerCase()];
        if (dayIndex === undefined) return 'Fecha no definida';

        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        if (today.getDay() === dayIndex) return 'Hoy';

        let nextDate = new Date(today);
        nextDate.setDate(today.getDate() + (dayIndex + 7 - today.getDay()) % 7);

        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return nextDate.toLocaleDateString('es-ES', options).replace('.', ''); 
    }
    // -----------------------------------------------------------------


    // --- 4. Funciones de Renderizado de Tarjetas ---

    /**
     * Genera el HTML para una tarjeta de sesión ACTIVA.
     */
    function createActiveSessionCard(session, nextDate) {
        return `
            <div class="bg-white p-7 rounded-lg shadow-md border cursor-pointer 
                transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-lg hover:border-primary-blue hover:translate-y-[-2px]" 
                data-id="${session.id_sesion}">
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
     * Genera el HTML para una tarjeta de sesión INACTIVA (Finalizada).
     */
    function createInactiveSessionCard(session) {
        // Nota: Las sesiones inactivas NO necesitan el efecto hover ni la fecha de "próximo" día.
        return `
            <div class="bg-gray-100 p-7 rounded-lg shadow-sm border" data-id="${session.id_sesion}">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-semibold text-text-light">${session.materia}</h3>
                    <span class="text-md text-text-dark">Finalizado</span>
                </div>
                <div class="space-y-2 text-lg">
                    <div class="flex items-center text-text-light">
                        <i class="ti ti-map-pin text-text-light text-lg mr-2"></i>
                        <span>${session.aula}</span>
                    </div>
                    <div class="flex items-center text-text-light">
                        <i class="ti ti-clock-hour-3 text-text-light text-lg mr-2"></i>
                        <span>${session.hora}</span>
                    </div>
                </div>
            </div>
        `;
    }


    // --- 5. Lógica de Carga, Filtrado y Renderizado Principal ---

    async function loadSessions() {
        if (!activeSessionsContainer || !inactiveSessionsContainer) return;
        
        try {
            // Cargar las sesiones desde el servidor JSON Server
            const API_BASE_URL = 'https://tutoria-digital.onrender.com';
            const response = await fetch(`${API_BASE_URL}/sesiones`);
            
            if (!response.ok) {
                throw new Error(`Error de red al conectar con la API (JSON Server): ${response.statusText}`);
            }
            
            const allSessions = await response.json();
            
            // 1. Filtrar sesiones por el ID del tutor
            const userSessions = allSessions.filter(session => session.id_tutor === currentUserId);

            // 2. Dividir en ACTIVAS e INACTIVAS
            const activeSessions = userSessions.filter(session => session.estado === 'activa');
            const inactiveSessions = userSessions.filter(session => session.estado === 'inactiva');

            
            // 3. Renderizar Sesiones ACTIVAS
            if (activeSessions.length > 0) {
                let activeHtml = activeSessions.map(session => {
                    const nextDate = calculateNextDate(session.dia);
                    return createActiveSessionCard(session, nextDate);
                }).join('');
                activeSessionsContainer.innerHTML = activeHtml;
            } else {
                activeSessionsContainer.innerHTML = '<p class="text-lg text-text-light">No tienes sesiones activas programadas.</p>';
            }

            // 4. Renderizar Sesiones INACTIVAS
            if (inactiveSessions.length > 0) {
                let inactiveHtml = inactiveSessions.map(session => {
                    return createInactiveSessionCard(session);
                }).join('');
                inactiveSessionsContainer.innerHTML = inactiveHtml;
            } else {
                inactiveSessionsContainer.innerHTML = '<p class="text-lg text-text-light">No hay historial de sesiones finalizadas.</p>';
            }


        } catch (error) {
            console.error('Error al cargar o renderizar las sesiones:', error);
            activeSessionsContainer.innerHTML = '<p class="text-lg text-red-600">Error: No se pudo conectar con el servidor de datos (¿npm start?).</p>';
            inactiveSessionsContainer.innerHTML = '';
        }
    }
    
    // Iniciar la carga de datos
    loadSessions();
});