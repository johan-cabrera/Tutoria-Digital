// Asegúrate de que esta función existe o ajusta la lógica si ya tienes un DOMContentLoaded
// 📢 URL base de la API. ¡Necesaria para la llamada de notificaciones!
const API_BASE_URL = 'https://tutoria-digital.onrender.com';
 // Asegúrate de que esta URL es correcta.

async function updateNotificationBadge(userId) {
    // 1. Obtener referencias a los contadores
    const desktopBadge = document.getElementById('desktop-notification-count');
    const mobileBadge = document.getElementById('mobile-notification-count');

    // 2. Si no existen los badges, no hacemos nada
    if (!desktopBadge && !mobileBadge) return;

    try {
        // 3. Consultar solo las notificaciones "entregado" (sin leer) del usuario actual
        // JSON Server permite usar query parameters (id_destinatario y estado)
        const response = await fetch(`${API_BASE_URL}/notificaciones?id_destinatario=${userId}&estado=entregado`);
        
        if (!response.ok) throw new Error('Error al obtener el conteo de notificaciones');
        
        const unreadNotifications = await response.json();
        const unreadCount = unreadNotifications.length;

        // 4. Actualizar ambos badges (Escritorio y Móvil)
        const updateBadge = (badgeElement) => {
            if (badgeElement) {
                if (unreadCount > 0) {
                    // Mostrar el badge con el conteo
                    badgeElement.textContent = unreadCount;
                    badgeElement.style.display = 'flex'; // O 'block', dependiendo de tu layout
                } else {
                    // Ocultar el badge
                    badgeElement.style.display = 'none';
                }
            }
        };

        updateBadge(desktopBadge);
        updateBadge(mobileBadge);

    } catch (error) {
        console.error("Fallo al actualizar el contador de notificaciones:", error);
        // Ocultar el badge en caso de error para evitar mostrar información incorrecta
        if (desktopBadge) desktopBadge.style.display = 'none';
        if (mobileBadge) mobileBadge.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    // Obtener las referencias al nuevo DOM
    const profileToggle = document.getElementById('profileToggle');
    const logoutMenu = document.getElementById('logoutMenu');
    const logoutButton = document.getElementById('logoutButton');

    // ----------------------------------------------------
    // Lógica del Toggle de Menú
    // ----------------------------------------------------
    
    if (profileToggle && logoutMenu) {
        
        // Función para mostrar/ocultar el menú
        const toggleMenu = () => {
            logoutMenu.classList.toggle('hidden');
            // Opcional: Rotar el ícono de la flecha
            const chevron = profileToggle.querySelector('.ti-chevron-down');
            if (chevron) {
                chevron.classList.toggle('rotate-180');
            }
        };

        // Escuchar el click en el botón de perfil
        profileToggle.addEventListener('click', toggleMenu);

        // Opcional: Cerrar el menú si se hace click fuera de él
        document.addEventListener('click', (event) => {
            const wrapper = document.getElementById('profileMenuWrapper');
            if (wrapper && !wrapper.contains(event.target) && !logoutMenu.classList.contains('hidden')) {
                logoutMenu.classList.add('hidden');
                // Quitar rotación de flecha si existe
                const chevron = profileToggle.querySelector('.ti-chevron-down');
                if (chevron) chevron.classList.remove('rotate-180');
            }
        });
    }

    // ----------------------------------------------------
    // Lógica de Cerrar Sesión
    // ----------------------------------------------------
    
    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault(); // Evita que el navegador siga el enlace '#'

            // 1. Limpiar el Local Storage
            localStorage.removeItem('currentUserSession');
            localStorage.removeItem('currentSessionId'); // Limpiar cualquier ID de sesión activa

            // 2. Redirigir al índice (página de login)
            // Asegúrate de que la ruta es correcta. Si estás en 'pages/inicio.html', necesitas '../index.html'
            window.location.href = '../index.html'; 
        });
    }

    loadNavbar();
});

// AÑADIR/AJUSTAR esta parte a tu loadNavbar para mostrar info en el menú
function loadNavbar() {
    
    // Obtener los datos de sesión del tutor
    const sessionString = localStorage.getItem('currentUserSession');
    
    // Referencias al DOM del perfil
    const profilePicContainer = document.getElementById('profilePictureContainer');
    const userNameElement = document.getElementById('current-user');
    const userRolElement = document.getElementById('user-rol');

    if (sessionString) {
        try {
            const userData = JSON.parse(sessionString);

            // Se asume que userData.id_usuario es el ID del destinatario
            updateNotificationBadge(userData.id_usuario); 
            
            // 1. Cargar nombre y rol en el header
            if (userNameElement) userNameElement.textContent = userData.nombre_completo;
            if (userRolElement) userRolElement.textContent = userData.rol.charAt(0).toUpperCase() + userData.rol.slice(1);

            // 📢 3. Cargar Foto de Perfil
            if (profilePicContainer && userData.foto_perfil) {
                
                // Definir la ruta de la imagen
                const imagePath = `../assets/profile_pics/${userData.foto_perfil}`;
                
                // Crear la etiqueta de imagen
                const imgElement = document.createElement('img');
                imgElement.src = imagePath;
                imgElement.alt = `Foto de perfil de ${userData.nombre_completo}`;
                imgElement.classList.add('w-full', 'h-full', 'object-cover'); 

                // Limpiar el contenido actual (el icono <i>)
                profilePicContainer.innerHTML = ''; 
                
                // Insertar la imagen en el contenedor
                profilePicContainer.appendChild(imgElement);

            } else if (profilePicContainer) {
                 // Si no hay foto_perfil, asegurar que el ícono por defecto esté
                profilePicContainer.innerHTML = '<i class="ti ti-user text-gray-500 text-lg"></i>';
            }
            
        } catch (error) {
            console.error("Error al parsear o cargar datos del usuario:", error);
        }
    } else {
        // Lógica para usuarios no logueados o error de sesión
        // Opcional: Redirigir a la página de login
    }
}