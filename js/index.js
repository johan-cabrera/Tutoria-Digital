// /js/login.js

// --- CONSTANTES DE CONFIGURACIÓN ---
const API_BASE_URL = 'https://tutoria-digital.onrender.com'; // URL de tu JSON Server
const REDIRECT_STORAGE_KEY = 'redirectAfterLogin'; // Clave usada por checkin.js

// --- FUNCIONES DE UTILIDAD ---

/**
 * Muestra un mensaje estilizado en el DOM (contenedor 'messageContainer').
 * El mensaje se oculta automáticamente después de 5 segundos.
 * * @param {string} message - El texto del mensaje a mostrar.
 * @param {('success'|'error')} type - Tipo de mensaje para aplicar estilos de color (verde o rojo).
 */
function displayMessage(message, type) {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;

    // Definir clases Tailwind basadas en el tipo
    let baseClasses = "p-3 rounded-lg text-white font-medium mb-4 transition-all duration-300";
    let typeClasses = "";

    if (type === 'error') {
        typeClasses = "bg-red-500 border border-red-700 shadow-md";
    } else if (type === 'success') {
        typeClasses = "bg-green-500 border border-green-700 shadow-md";
    }

    messageContainer.innerHTML = `<div class="${baseClasses} ${typeClasses}">${message}</div>`;
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 5000);
}

/**
 * Carga la lista de usuarios desde JSON Server para validar las credenciales.
 * * @async
 * @returns {Promise<Array<Object>>} Una promesa que resuelve con la lista de objetos de usuarios.
 */
async function fetchUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/usuarios`);
        if (!response.ok) {
            throw new Error(`Error al cargar los usuarios: ${response.statusText}`);
        }
        return await response.json(); 
    } catch (error) {
        console.error('Fallo en la operación de fetch:', error);
        displayMessage('Error: No se pudo conectar con el servidor de datos (¿JSON Server activo?).', 'error');
        return [];
    }
}

// --- FUNCIÓN PRINCIPAL DE LOGÍN ---

/**
 * Maneja el evento de envío del formulario de inicio de sesión.
 * Valida las credenciales y maneja la redirección condicional.
 * * @async
 * @param {Event} event - El objeto de evento de envío del formulario.
 */
const handleLogin = async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    const email = emailInput.value.trim().toLowerCase(); 
    const password = passwordInput.value.trim();

    if (!email || !password) {
        displayMessage('Por favor, ingresa tu usuario y contraseña.', 'error');
        return;
    }

    const validUsers = await fetchUsers();
    
    const userFound = validUsers.find(user => 
        // Validación contra las claves de tu JSON Server
        user.correo_electronico === email && user.contrasena === password 
    );

    if (userFound) {
        // 1. Crear y Guardar datos de Sesión en localStorage
        const sessionData = {
            id_usuario: userFound.id,
            nombre_completo: userFound.nombre_completo,
            rol: userFound.rol,
            foto_perfil: userFound.foto_perfil, 
            tiempo_login: new Date().toISOString()
        };
        
        localStorage.setItem('currentUserSession', JSON.stringify(sessionData));
        
        displayMessage(`Inicio de sesión exitoso. Redirigiendo...`, 'success');
        
        // 2. Lógica de Redirección Condicional
        const redirectUrl = localStorage.getItem(REDIRECT_STORAGE_KEY);
        
        setTimeout(() => {
            if (redirectUrl) {
                // REDIRECCIÓN A CHECK-IN: Si la clave existe, redirigimos ahí.
                window.location.href = redirectUrl;
                localStorage.removeItem(REDIRECT_STORAGE_KEY); // Limpiar clave inmediatamente
            } else {
                // REDIRECCIÓN NORMAL: Si no hay clave, vamos a la página de inicio.
                // La ruta es relativa a index.html: 'pages/inicio.html'
                window.location.href = 'pages/inicio.html'; 
            }
        }, 1000); // Pequeño retraso para que el mensaje de éxito se vea

    } else {
        displayMessage('Credenciales incorrectas. Verifica tu correo y contraseña.', 'error');
        passwordInput.value = '';
        passwordInput.focus();
    }
};

// --- PUNTO DE ENTRADA ---

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});