// 📢 URL base de la API. ¡Asegúrate de cambiarla entre localhost y Render!

document.addEventListener('DOMContentLoaded', () => {
    loadUserNotifications();
    setupMarkAllButton();
});

// Almacenará los datos de todos los usuarios para evitar múltiples llamadas fetch.
let usersMap = {}; 

// ----------------------------------------------------
// 1. UTILIDADES DE TIEMPO (Se mantiene igual)
// ----------------------------------------------------

function formatTimeSince(dateString, timeString) {
    const notificationDateTime = new Date(`${dateString}T${timeString}`);
    const now = new Date();
    const diffInSeconds = Math.floor((now - notificationDateTime) / 1000);

    const secondsInMinute = 60;
    const secondsInHour = 3600;
    const secondsInDay = 86400;

    // Menos de 24 horas
    if (diffInSeconds < secondsInDay) {
        const hours = Math.floor(diffInSeconds / secondsInHour);
        if (hours > 0) return `Hace ${hours}h`;
        const minutes = Math.floor(diffInSeconds / secondsInMinute);
        if (minutes > 0) return `Hace ${minutes}m`;
        return `Hace unos segundos`;
    }

    // Ayer (Entre 24h y 48h)
    const notificationDateOnly = notificationDateTime.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayDateOnly = yesterday.toDateString();

    if (notificationDateOnly === yesterdayDateOnly) {
        return 'Ayer';
    }

    // A partir del tercer día hasta el final del año (ej: "5 Sep")
    const diffInDays = Math.floor(diffInSeconds / secondsInDay);
    if (diffInDays < 365) {
        const options = { day: 'numeric', month: 'short' };
        return notificationDateTime.toLocaleDateString('es-ES', options).replace('.', '');
    }

    // Más de un año
    const years = Math.floor(diffInDays / 365);
    return `Hace ${years} años`;
}

// notificaciones.js (FUNCIÓN markAsSeen ACTUALIZADA)
// ----------------------------------------------------
// 2. MARCAR NOTIFICACIONES COMO VISTAS (MODIFICADA PARA RECARGA)
// ----------------------------------------------------

async function markAsSeen(notificationsToUpdate) {
    // Solo procesa las que están 'entregado'
    const deliveredNotifications = notificationsToUpdate.filter(n => n.estado === 'entregado');

    if (deliveredNotifications.length === 0) {
        console.log("No hay notificaciones nuevas para marcar como vistas.");
        return; 
    }

    const patchPromises = deliveredNotifications.map(n => {
        const correctUrl = `${API_BASE_URL}/notificaciones/${n.id}`;
        
        return fetch(correctUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: 'visto' })
        })
        .then(patchRes => {
            if (!patchRes.ok) {
                return patchRes.text().then(text => {
                    throw new Error(`Fallo HTTP ${patchRes.status} al hacer PATCH. ID: ${n.id}. URL: ${correctUrl}. Respuesta: ${text}`);
                });
            }
            return patchRes.json();
        })
        .catch(error => {
            console.error(`Error al actualizar notificación ID ${n.id}:`, error);
            return Promise.resolve();
        });
    });

    await Promise.all(patchPromises);

    // 📢 RECARGAR LAS NOTIFICACIONES para que la vista muestre el nuevo estado 'visto'
    loadUserNotifications();
}

// ----------------------------------------------------
// 3. LÓGICA DE CARGA Y RENDERIZADO
// ----------------------------------------------------

async function fetchAllUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios`);
        if (!response.ok) throw new Error('Error al obtener todos los usuarios');
        const users = await response.json();
        
        usersMap = users.reduce((acc, user) => {
            acc[user.id] = user; // Corregido para usar 'id'
            return acc;
        }, {});
    } catch (error) {
        console.error("Error al obtener la lista de usuarios:", error);
    }
}

async function loadUserNotifications() {
    const listContainer = document.getElementById('notifications-list');
    const markAllButton = document.getElementById('markAllAsSeenButton');
    listContainer.innerHTML = ''; 

    const sessionString = localStorage.getItem('currentUserSession');
    if (!sessionString) {
        // ... (Manejo de sesión no activa)
        if (markAllButton) markAllButton.style.display = 'none';
        return;
    }

    try {
        const userData = JSON.parse(sessionString);
        const currentUserId = userData.id_usuario; 

        await fetchAllUsers();

        const response = await fetch(`${API_BASE_URL}/notificaciones`);
        if (!response.ok) throw new Error('Error al obtener notificaciones');
        let allNotifications = await response.json(); 

        const userNotifications = allNotifications
            .filter(n => n.id_destinatario == currentUserId)
            .sort((a, b) => {
                const dateA = new Date(`${a.fecha}T${a.hora}`);
                const dateB = new Date(`${b.fecha}T${b.hora}`);
                return dateB - dateA; 
            });

        if (userNotifications.length === 0) {
            listContainer.innerHTML = '<p class="text-center text-text-light p-8">No tienes notificaciones recientes.</p>';
            if (markAllButton) markAllButton.style.display = 'none';
            return;
        }
        
        // ❌ ELIMINAMOS: await markAsSeen(userNotifications); // ¡Ya no se actualiza automáticamente!

        // 4. Renderizar las notificaciones con datos del emisor
        let unreadCount = 0; // Contar cuántas están sin leer (entregado)
        
        userNotifications.forEach(n => {
            const timeSince = formatTimeSince(n.fecha, n.hora);
            const emisorData = usersMap[n.id_emisor] || { nombre_completo: 'Usuario Desconocido', foto_perfil: 'default.png' }; 
            const emisorPhotoPath = `../assets/profile_pics/${emisorData.foto_perfil}`;

            const isUnread = n.estado === 'entregado'; 
            if (isUnread) unreadCount++; // Incrementar el contador

            // 📢 ESTILO: 'entregado' es el fondo blanco/visible, 'visto' es el fondo gris/sutil
            const itemClasses = isUnread ? 
                'bg-white' : // Sin ver (más visible)
                'bg-gray-50'; // Visto (sutil)

            const notificationHtml = `
                <div class="${itemClasses} flex items-start justify-between border-b p-4 md:px-6 last:border-b-0 transition-colors">
                    <div class="flex items-start space-x-3 md:space-x-4">
                        <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img src="${emisorPhotoPath}" alt="Foto de ${emisorData.nombre_completo}" class="w-full h-full object-cover">
                        </div>

                        <div>
                            <p class="${isUnread ? 'font-bold' : 'font-medium'} text-base md:text-xl text-text-dark mb-1">${n.titulo}</p>
                            <p class="text-sm md:text-lg text-text-dark leading-relaxed">
                                ${n.mensaje}
                            </p>
                        </div>
                    </div>

                    <div class="flex-shrink-0 ml-4 pt-1 md:pt-0">
                        <span class="text-text-light text-xs md:text-sm">${timeSince}</span>
                    </div>
                </div>
            `;
            listContainer.innerHTML += notificationHtml;
        });

        // 📢 MOSTRAR/OCULTAR BOTÓN: Solo se muestra si hay notificaciones sin leer
        if (markAllButton) {
            markAllButton.style.display = unreadCount > 0 ? 'block' : 'none';
        }

    } catch (error) {
        console.error("Error al cargar las notificaciones:", error);
        listContainer.innerHTML = '<p class="text-center text-red-500 p-8">Error al conectar con el servidor.</p>';
    }
}

// ----------------------------------------------------
// 4. LÓGICA DEL BOTÓN MARCAR TODO COMO VISTO (NUEVO)
// ----------------------------------------------------

function setupMarkAllButton() {
    const markAllButton = document.getElementById('markAllAsSeenButton');
    
    if (markAllButton) {
        markAllButton.addEventListener('click', async () => {
            
            const sessionString = localStorage.getItem('currentUserSession');
            if (!sessionString) return; 

            try {
                // Deshabilitar botón temporalmente para evitar doble clic
                markAllButton.disabled = true;
                markAllButton.textContent = 'Actualizando...';

                const userData = JSON.parse(sessionString);
                const currentUserId = userData.id_usuario; 
                
                // 1. Obtener SOLO las notificaciones DEL USUARIO
                const response = await fetch(`${API_BASE_URL}/notificaciones?id_destinatario=${currentUserId}&estado=entregado`);
                if (!response.ok) throw new Error('Error al obtener notificaciones para marcar');
                
                const deliveredNotifications = await response.json();
                
                // 2. Llamar a la función de actualización
                await markAsSeen(deliveredNotifications);

                // Revertir el estado del botón (será ocultado por loadUserNotifications si el conteo es 0)
                markAllButton.textContent = 'Marcar todo como visto';
                markAllButton.disabled = false;
                
            } catch (error) {
                console.error("Fallo al marcar todo como visto:", error);
                // Asegurar que el botón se habilite si falla
                markAllButton.textContent = 'Marcar todo como visto';
                markAllButton.disabled = false;
            }
        });
    }
}