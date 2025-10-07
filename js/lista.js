document.addEventListener('DOMContentLoaded', () => {

    const qrContainer = document.getElementById('qrcode');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const generateButton = document.getElementById('generateQrButton');
    const sessionSelect = document.getElementById('sessionSelect'); 
    
    // --- Lógica de Obtención de Usuario ---
    const sessionString = localStorage.getItem('currentUserSession');
    let currentUserId = null;
    if (sessionString) {
        try {
            currentUserId = JSON.parse(sessionString).id_usuario;
        } catch (error) {
            console.error("Error al obtener ID de usuario:", error);
            // Si hay error, detenemos la ejecución
            return; 
        }
    } else {
        console.error("No hay sesión de usuario activa.");
        return;
    }
    // ---------------------------------------

    /**
     * 1. Carga las sesiones activas del tutor y llena el <select>.
     */
    async function loadActiveSessions(userId) {
        // Limpiar opciones estáticas y deshabilitar temporalmente
        sessionSelect.innerHTML = '<option value="">Cargando sesiones...</option>';
        sessionSelect.disabled = true;

        try {
            
            const response = await fetch(`${API_BASE_URL}/sesiones`); 
            
            if (!response.ok) throw new Error("Error al cargar la lista de sesiones.");
            
            const allSessions = await response.json();

            // Filtrar sesiones por ID de tutor y estado 'activa'
            const activeUserSessions = allSessions.filter(session => 
                session.id_tutor == userId && session.estado == 'activa'
            );

            // 2. Generar el HTML de las opciones
            let optionsHtml = '';
            
            if (activeUserSessions.length > 0) {
                optionsHtml = '<option value="" disabled selected>Seleccione una sesión...</option>';
                activeUserSessions.forEach(session => {
                    // Usamos el id_sesion como valor para identificarlo en la URL
                    optionsHtml += `<option value="${session.id}">${session.materia}</option>`;
                });
                sessionSelect.disabled = false;
                generateButton.disabled = false; // Habilitar botón si hay sesiones
            } else {
                optionsHtml = '<option value="">No tiene sesiones activas</option>';
                generateButton.disabled = true; // Deshabilitar botón si no hay sesiones
            }
            
            // 3. Insertar opciones
            sessionSelect.innerHTML = optionsHtml;

        } catch (error) {
            console.error('Error al llenar el selector de sesiones:', error);
            sessionSelect.innerHTML = '<option value="">Error al cargar (JSON Server caído?)</option>';
            generateButton.disabled = true;
        }
    }

    /**
     * 2. Función para generar el QR (MODIFICADA para usar el ID real)
     */
    function generateQr() {
        const selectedSessionId = sessionSelect.value; 

        if (!selectedSessionId) {
            alert("Por favor, seleccione una sesión activa.");
            return;
        }
        
        // 📢 URL REAL A UTILIZAR: Usaremos una URL base + el ID de la sesión
        // Esto permitiría a la página de asistencia saber qué sesión registrar.
        const sessionUrl = `http://dominio-de-asistencia.com/checkin?session=${selectedSessionId}`;

        // OCULTAR QR anterior y MOSTRAR SPINNER
        qrContainer.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');

        // SIMULACIÓN DE CARGA (para que el spinner se vea)
        setTimeout(() => {
            // 1. Limpia cualquier QR anterior
            qrContainer.innerHTML = '';
            
            // 2. Genera el código QR
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
            
            // 3. Aplica la animación de aparición de GSAP
            gsap.set(qrContainer, { opacity: 0 }); 
            gsap.to(qrContainer, { duration: 0.8, opacity: 1, ease: "power2.out" });

            console.log("QR generado para URL:", sessionUrl);

        }, 700); // 700ms de simulación de carga
    }

    // Asigna el evento al botón para generar el QR
    generateButton.addEventListener('click', generateQr);
    
    // Iniciar la carga de sesiones al inicio
    if (currentUserId) {
        loadActiveSessions(currentUserId);
    }
});