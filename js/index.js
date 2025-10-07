document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageContainer = document.getElementById('messageContainer'); 

    /**
     * Muestra un mensaje estilizado en el DOM y lo oculta automáticamente.
     * @param {string} message - El texto del mensaje.
     * @param {('success'|'error')} type - Tipo de mensaje para aplicar estilos.
     */
    function displayMessage(message, type) {
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

    // Función asíncrona para cargar los usuarios
    async function fetchUsers() {
        try {
            // Ruta a database/usuarios.json, relativa al index.html
            const API_BASE_URL = 'http://localhost:3000';
            const response = await fetch(`${API_BASE_URL}/usuarios`);
            if (!response.ok) {
                throw new Error(`Error al cargar los usuarios: ${response.statusText}`);
            }
            return await response.json(); 
        } catch (error) {
            console.error('Fallo en la operación de fetch:', error);
            displayMessage('Error: No se pudo conectar con el servidor de datos (¿npm start?).', 'error');
            return [];
        }
    }

    // Función principal para manejar el inicio de sesión
    const handleLogin = async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            displayMessage('Por favor, ingresa tu usuario y contraseña.', 'error');
            return;
        }

        const validUsers = await fetchUsers();
        
        const userFound = validUsers.find(user => 
            // Usamos las claves del JSON: 'correo_electronico' y 'contrasena'
            user.correo_electronico === email && user.contrasena === password 
        );

        if (userFound) {
            // --- INICIO: Guardar datos de Sesión en localStorage ---
            //Crear el objeto de la sesión
            const sessionData = {
                id_usuario: userFound.id,
                nombre_completo: userFound.nombre_completo,
                rol: userFound.rol,
                foto_perfil: userFound.foto_perfil, 
                tiempo_login: new Date().toISOString()
            };
            
            
            // Guardar el objeto de sesión. 
            // Esto SIMULA la escritura en cache/sesion.json, ya que JS del navegador 
            // no puede escribir archivos directamente.
            localStorage.setItem('currentUserSession', JSON.stringify(sessionData));
            
            // 3. Confirmación (Opcional)
            console.log('Sesión guardada:', sessionData);
            displayMessage(`Inicio de sesión exitoso. Redirigiendo...`, 'success');
            
            // 4. Redirigir a pages/inicio.html
            // La ruta es relativa al index.html, por eso entramos a la carpeta 'pages'.
            window.location.href = 'pages/inicio.html'; 

        } else {
            displayMessage('Credenciales incorrectas. Verifica tu correo y contraseña.', 'error');
            passwordInput.value = '';
            passwordInput.focus();
        }
    };

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});