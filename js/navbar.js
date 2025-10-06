// Asegúrate de que esta función existe o ajusta la lógica si ya tienes un DOMContentLoaded
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