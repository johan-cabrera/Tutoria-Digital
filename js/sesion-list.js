// ../js/sesion-list.js

document.addEventListener('DOMContentLoaded', () => {

    const SESSION_ID_STORAGE_KEY = 'currentSessionId'; 
    const attendanceBody = document.getElementById('attendance-body');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageInfoSpan = document.getElementById('page-info');
    const paginationControls = document.getElementById('pagination-controls'); // Contenedor de los controles
    
    const sessionId = parseInt(localStorage.getItem(SESSION_ID_STORAGE_KEY));

    // Variables de estado de la paginación
    let currentPage = 1;
    const recordsPerPage = 5; // 📢 Máximo de registros por página
    let allSessionAttendance = []; // Guardará todos los registros filtrados

    if (!attendanceBody || !sessionId) {
        if (attendanceBody) {
            attendanceBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">Selecciona una sesión activa para ver asistencias.</td></tr>';
        }
        return;
    }
    
    // Ocultar controles al inicio, se mostrarán si hay datos.
    if (paginationControls) paginationControls.style.display = 'none';

    /**
     * Genera la fila HTML para un registro de asistencia. (Mantenemos esta función)
     */
    function createAttendanceRow(record) {
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-text-dark">${record.fecha}</td>
                <td class="px-6 py-4 whitespace-nowrap text-text-dark">${record.hora}</td>
                <td class="px-6 py-4 whitespace-nowrap text-text-dark">${record.nombre_estudiante}</td>
                <td class="px-6 py-4 whitespace-nowrap text-text-dark">${record.carrera}</td>
                <td class="px-6 py-4 whitespace-nowrap text-text-dark">${record.correo}</td>
                <td class="px-6 py-4 whitespace-nowrap text-text-dark">${record.telefono}</td>
            </tr>
        `;
    }

    /**
     * Muestra la página actual de datos en la tabla y actualiza los controles.
     */
    function displayTablePage(page) {
        currentPage = page;
        const totalRecords = allSessionAttendance.length;
        const totalPages = Math.ceil(totalRecords / recordsPerPage);

        // 1. Calcular índices de inicio y fin para la rebanada (slice)
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;

        // 2. Obtener los registros de la página actual
        const recordsToDisplay = allSessionAttendance.slice(startIndex, endIndex);

        // 3. Renderizar filas
        if (recordsToDisplay.length > 0) {
            const attendanceHtml = recordsToDisplay.map(createAttendanceRow).join('');
            attendanceBody.innerHTML = attendanceHtml;
        } else {
            attendanceBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-text-light">No hay más registros en esta página.</td></tr>';
        }

        // 4. Actualizar estado de los botones y el indicador de página
        if (prevButton) prevButton.disabled = currentPage === 1;
        if (nextButton) nextButton.disabled = currentPage === totalPages || totalPages === 0;
        
        if (pageInfoSpan) {
            pageInfoSpan.textContent = `Página ${currentPage} de ${totalPages}`;
        }
    }
    
    // --- Lógica de Manejo de Eventos ---

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                displayTablePage(currentPage - 1);
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const totalPages = Math.ceil(allSessionAttendance.length / recordsPerPage);
            if (currentPage < totalPages) {
                displayTablePage(currentPage + 1);
            }
        });
    }


    /**
     * Carga todas las asistencias, las filtra, las guarda y luego inicia la paginación.
     */
    async function loadAttendanceHistory() {
        attendanceBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-primary-blue">Cargando historial...</td></tr>';
        if (paginationControls) paginationControls.style.display = 'none';

        try {
            // 1. Obtener todos los registros de asistencia
            const API_BASE_URL = 'https://tutoria-digital.onrender.com';
            const response = await fetch(`${API_BASE_URL}/asistencias`);
            
            if (!response.ok) {
                throw new Error("Error de red al obtener el historial de asistencias.");
            }
            
            const allAttendance = await response.json();

            // 2. Filtrar las asistencias por el id_sesion actual y guardarlas
            allSessionAttendance = allAttendance.filter(record => record.id_sesion === sessionId);

            if (allSessionAttendance.length === 0) {
                attendanceBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-text-light">No hay registros de asistencia para esta sesión.</td></tr>';
                return;
            }

            // 3. Mostrar controles y renderizar la primera página
            if (paginationControls) paginationControls.style.display = 'flex';
            displayTablePage(1);

        } catch (error) {
            console.error('Error al cargar la tabla de asistencias:', error);
            attendanceBody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-red-600">Error al cargar el historial de asistencias.</td></tr>';
        }
    }
    
    // Iniciar el proceso de carga
    loadAttendanceHistory();
});