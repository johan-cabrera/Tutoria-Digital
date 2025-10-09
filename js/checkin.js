// ../js/checkin.js
const LOGIN_PAGE_URL = 'https://tutoria-digital-1.onrender.com/index.html'; // Asegúrate de que este puerto sea correcto
const SESSION_STORAGE_KEY = 'currentUserSession';
const REDIRECT_STORAGE_KEY = 'redirectAfterLogin';

/**
 * 1. Obtiene el ID de la sesión (URL) y el ID/Rol del usuario (localStorage).
 * @returns {{sessionId: number|null, userId: number|null, userRole: string|null}} Datos de la sesión.
 */
function getCheckinData() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = parseInt(urlParams.get('session'));

    const sessionString = localStorage.getItem(SESSION_STORAGE_KEY);
    
    if (sessionString) {
        try {
            const sessionData = JSON.parse(sessionString);
            // Usamos 'id_usuario' como confirmaste.
            return {
                sessionId: sessionId,
                userId: sessionData.id_usuario, 
                userRole: sessionData.rol
            };
        } catch (e) {
            console.error("Error al parsear la sesión:", e);
        }
    }
    
    return { sessionId: sessionId, userId: null, userRole: null };
}

/**
 * 2. Muestra el estado del proceso al usuario, incluyendo colores, título e íconos.
 * Se actualizan los elementos: checkin-status, status-title, status-message, status-icon.
 * @param {'success'|'error'|'loading'|'redirect'} type - Tipo de mensaje a mostrar.
 * @param {string} title - Título principal (H1).
 * @param {string} message - Mensaje descriptivo.
 */
function updateUI(type, title, message) {
    const statusContainer = document.getElementById('checkin-status');
    const statusTitle = document.getElementById('status-title');
    const statusMessage = document.getElementById('status-message');
    const successSvg = document.getElementById('success-svg');
    const loadingSpinner = document.getElementById('loading-spinner');
    const statusIconContainer = document.getElementById('status-icon');
    
    if (!statusContainer || !statusTitle || !statusMessage || !successSvg || !loadingSpinner) return;

    // 1. Limpia y establece clases base
    statusContainer.className = 'flex flex-col items-center justify-center p-12 bg-white shadow-md rounded-2xl w-full max-w-lg transition-all duration-500 ease-in-out border';
    statusTitle.className = 'text-3xl font-extrabold mb-2 text-center';
    statusMessage.className = 'text-lg text-center';
    
    // Oculta todos los iconos primero
    successSvg.style.display = 'none';
    loadingSpinner.style.display = 'none';

    // 2. Definición por tipo de estado
    if (type === 'success') {
        statusTitle.classList.add('text-green-600');
        statusMessage.classList.add('text-text-dark');
        successSvg.style.display = 'block';

    } else if (type === 'error') {
        statusTitle.classList.add('text-red-600');
        statusMessage.classList.add('text-text-light');
        statusIconContainer.innerHTML = '<i class="ti ti-alert-octagon text-red-500 text-6xl"></i>';

    } else if (type === 'loading') {
        statusTitle.classList.add('text-primary-blue');
        statusMessage.classList.add('text-text-light');
        loadingSpinner.style.display = 'block';
    
    } else if (type === 'redirect') {
        statusTitle.classList.add('text-yellow-600');
        statusMessage.classList.add('text-text-dark');
        statusIconContainer.innerHTML = '<i class="ti ti-login text-yellow-500 text-6xl"></i>'; 
    }
    
    // 3. Inyectar contenido
    statusTitle.textContent = title;
    statusMessage.textContent = message;
}

/**
 * NUEVA FUNCIÓN: Inicia un contador que actualiza el mensaje de la UI y luego redirige.
 * @param {number} initialSeconds - Segundos iniciales para el conteo.
 */
function startRedirectCountdown(initialSeconds = 5) {
    let seconds = initialSeconds;
    const loginUrl = LOGIN_PAGE_URL;
    
    const statusMessageElement = document.getElementById('status-message');

    // Muestra el mensaje inicial
    if (statusMessageElement) {
        statusMessageElement.textContent = `Redirigiendo en ${seconds} s`;
    }

    const countdownInterval = setInterval(() => {
        seconds--;

        if (seconds > 0) {
            // Actualiza el texto con el nuevo conteo
            if (statusMessageElement) {
                statusMessageElement.textContent = `Redirigiendo en ${seconds} s`;
            }
        } else {
            // Conteo terminado
            clearInterval(countdownInterval);
            
            // Mensaje final
            if (statusMessageElement) {
                statusMessageElement.textContent = 'Redirigiendo ahora...';
            }
            
            // Redirección
            window.location.href = loginUrl;
        }
    }, 1000);
}

/**
 * 3. Realiza la petición POST a JSON Server para registrar la asistencia.
 * Incluye una verificación previa para evitar duplicados en el mismo día.
 * @param {number} sessionId - ID de la sesión de tutoría.
 * @param {number} userId - ID del usuario/estudiante que asiste.
 */
async function registerAttendance(sessionId, userId) {
    updateUI('loading', 'Procesando Asistencia', 'Verificando y registrando su entrada, por favor espere...');

    const today = new Date().toISOString().split('T')[0];

    // Paso A: Verificación de asistencia duplicada
    try {
        const checkResponse = await fetch(`${API_BASE_URL}/asistencias?id_sesion=${sessionId}&id_usuario=${userId}&fecha=${today}`);
        const existingRecords = await checkResponse.json();

        if (existingRecords.length > 0) {
            updateUI('success', '¡Asistencia ya Registrada!', 'Ya habías marcado tu entrada para esta sesión hoy. Gracias.');
            return;
        }
    } catch (e) {
        console.warn("Fallo la verificación de asistencia existente. Procediendo con el registro.", e);
    }
    
    // Paso B: Registro de la nueva asistencia
    const now = new Date();
    
    const newAttendanceRecord = {
        fecha: today, 
        hora: now.toTimeString().split(' ')[0], 
        id_usuario: userId,
        id_sesion: sessionId
    };

    try {
        const response = await fetch(`${API_BASE_URL}/asistencias`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newAttendanceRecord)
        });

        if (response.ok) {
            updateUI('success', '¡Asistencia Registrada con Éxito!', 'Tu registro ha sido completado. Puedes cerrar esta ventana.');
        } else {
            updateUI('error', 'Fallo en el Registro', 'Hubo un error al registrar la asistencia. Intente escanear el código nuevamente o contacte a su tutor.');
            console.error('Error POST:', response.status, await response.text());
        }

    } catch (error) {
        updateUI('error', 'Error de Conexión', 'No se pudo conectar con el servidor. Verifique si JSON Server está activo.');
        console.error('Error de red al registrar asistencia:', error);
    }
}


/**
 * 4. Lógica principal de check-in.
 */
function handleCheckin() {
    const { sessionId, userId, userRole } = getCheckinData();

    // 4.1. Error: Falta ID de Sesión
    if (!sessionId) {
        updateUI('error', 'Código QR Inválido', 'El código QR no contiene la información de sesión necesaria.');
        return;
    }
    
    // 4.2. Error: Rol Incorrecto (Si un tutor intenta escanear)
    if (userId && userRole !== 'estudiante' && userRole !== 'tutor') {
        updateUI('error', 'Acceso Denegado', `Su rol (${userRole}) no tiene permiso para registrar asistencia en esta vista.`);
        return;
    }
    
    // 4.3. Flujo SIN SESIÓN: Redirigir a Login
    if (!userId) {
        // Almacena la URL actual para redireccionar después del login
        localStorage.setItem(REDIRECT_STORAGE_KEY, window.location.href); 
        
        updateUI('redirect', 'Inicia Sesión Requerida', 'Debe iniciar sesión para registrar su asistencia. Redirigiendo...');
        
        // Redirigir después de 1.5 segundos
        startRedirectCountdown(5); 

        return;
    }
    
    // 4.4. Flujo CON SESIÓN: Registrar Asistencia
    // Si llega aquí, es un estudiante logueado.
    registerAttendance(sessionId, userId);
    
    // Limpia la clave de redirección si existe (cubre el caso de login exitoso)
    localStorage.removeItem(REDIRECT_STORAGE_KEY);
}


// --- PUNTO DE ENTRADA ---
// --- PUNTO DE ENTRADA MODULARIZADO CON RETRASO ---
document.addEventListener('DOMContentLoaded', () => {
    // Retrasamos 500ms la ejecución para asegurar que localStorage se sincronice 
    // después de una redirección del login.
    setTimeout(handleCheckin, 500); 
});