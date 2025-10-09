// ../js/qr-generator.js

// --- CONFIGURACIÓN BASE ---
const CHECKIN_BASE_URL = 'https://tutoria-digital-1.onrender.com/checkin.html'; // 
const SESSION_STORAGE_KEY = 'currentUserSession';


// --- REFERENCIAS DOM ---
const qrContainer = document.getElementById('qrcode');
const loadingSpinner = document.getElementById('loadingSpinner');
const generateButton = document.getElementById('generateQrButton');
const sessionSelect = document.getElementById('sessionSelect');


/**
 * Obtiene el ID del usuario actual desde el localStorage.
 * @returns {number|null} El ID del usuario o null si no hay sesión.
 */
function getCurrentUserId() {
    const sessionString = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionString) {
        try {
            // Utilizamos el campo 'id' que es la PK del usuario
            return JSON.parse(sessionString).id_usuario; 
        } catch (error) {
            console.error("Error al obtener ID de usuario:", error);
            return null; 
        }
    }
    console.error("No hay sesión de usuario activa.");
    return null;
}

/**
 * Carga las sesiones activas del tutor y llena el selector.
 * @param {number} userId - ID del tutor actual.
 */
async function loadActiveSessions(userId) {
    sessionSelect.innerHTML = '<option value="">Cargando sesiones...</option>';
    sessionSelect.disabled = true;

    try {
        // Filtrar por id_tutor y estado 'activa' (la lógica está correcta)
        const response = await fetch(`${API_BASE_URL}/sesiones?id_tutor=${userId}&estado=activa`); 
        
        if (!response.ok) throw new Error("Error al cargar la lista de sesiones.");
        
        const activeUserSessions = await response.json();

        let optionsHtml = '';
        
        if (activeUserSessions.length > 0) {
            optionsHtml = '<option value="" disabled selected>Seleccione una sesión...</option>';
            activeUserSessions.forEach(session => {
                optionsHtml += `<option value="${session.id}">${session.materia}</option>`;
            });
            sessionSelect.disabled = false;
            generateButton.disabled = false;
        } else {
            optionsHtml = '<option value="">No tiene sesiones activas</option>';
            generateButton.disabled = true;
        }
        
        sessionSelect.innerHTML = optionsHtml;

    } catch (error) {
        console.error('Error al llenar el selector de sesiones:', error);
        sessionSelect.innerHTML = '<option value="">Error al cargar</option>';
        generateButton.disabled = true;
    }
}

/**
 * Genera el QR y lo muestra en el contenedor.
 */
function generateQr() {
    const selectedSessionId = sessionSelect.value; 

    if (!selectedSessionId) {
        alert("Por favor, seleccione una sesión activa.");
        return;
    }
    
    // URL que el QR contendrá
    const sessionUrl = `${CHECKIN_BASE_URL}?session=${selectedSessionId}`;

    // OCULTAR QR anterior y MOSTRAR SPINNER
    qrContainer.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');

    // SIMULACIÓN DE CARGA
    setTimeout(() => {
        qrContainer.innerHTML = '';
        
        // Genera el código QR
        new QRCode(qrContainer, {
            text: sessionUrl,
            width: 256, 
            height: 256,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        // OCULTAR SPINNER y MOSTRAR QR
        loadingSpinner.classList.add('hidden');
        qrContainer.classList.remove('hidden');
        
        // Aplicamos animación (GSAP)
        gsap.set(qrContainer, { opacity: 0 }); 
        gsap.to(qrContainer, { duration: 0.8, opacity: 1, ease: "power2.out" });

        console.log("QR generado para URL:", sessionUrl);

    }, 700); 
}

/**
 * Inicializa el script.
 */
function initializeQrGenerator() {
    const currentUserId = getCurrentUserId();
    
    if (currentUserId) {
        loadActiveSessions(currentUserId);
    } else {
        // En un entorno real, esto redirigiría a login si no hay sesión
        console.warn("No se puede inicializar el generador QR: Usuario no identificado.");
    }
    
    // Asigna el evento al botón
    generateButton.addEventListener('click', generateQr);
}


// --- PUNTO DE ENTRADA ---
document.addEventListener('DOMContentLoaded', initializeQrGenerator);