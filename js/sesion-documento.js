// /js/sesion-documento.js
const SESSION_STORAGE_KEY = 'currentUserSession';
const SESSION_ID_STORAGE_KEY = 'currentSessionId'; // Nueva constante para el ID de la sesión

/**
 * 1. Obtiene el ID de la sesión (desde localStorage) y la información del tutor logueado.
 * @returns {{sessionId: number, tutorName: string|null, userRole: string|null}}
 */
function getDocumentData() {
    // 1. Obtener ID de Sesión desde localStorage (nueva fuente de datos)
    const sessionIdString = localStorage.getItem(SESSION_ID_STORAGE_KEY);
    const sessionId = sessionIdString ? parseInt(sessionIdString) : null;
    
    // 2. Obtener datos del tutor (el resto de la lógica de usuario se mantiene)
    const sessionString = localStorage.getItem(SESSION_STORAGE_KEY);
    let tutorName = null;
    let userRole = null;
    
    if (sessionString) {
        try {
            const sessionData = JSON.parse(sessionString);
            tutorName = sessionData.nombre_completo;
            userRole = sessionData.rol;
        } catch (e) {
            console.error("Error al parsear la sesión:", e);
        }
    }
    
    return { sessionId, tutorName, userRole };
}

/**
 * 2. Fetches todos los datos de asistencia y de los estudiantes asociados.
 * @param {number} sessionId - ID de la sesión a consultar.
 * @returns {Promise<Array<Object>>} Un array de objetos de asistencia con datos de usuario.
 */
async function fetchAttendanceData(sessionId) {
    if (!sessionId) return [];

    try {
        // Obtenemos todas las asistencias para esta sesión
        const attendanceResponse = await fetch(`${API_BASE_URL}/asistencias?id_sesion=${sessionId}`);
        const attendances = await attendanceResponse.json();
        
        // Obtenemos los IDs de usuario únicos
        const userIds = [...new Set(attendances.map(a => a.id_usuario))];
        
        // Obtenemos todos los usuarios en una sola llamada (si tu API lo permite, o iteramos si es necesario)
        const users = {};
        for (const id of userIds) {
            const userResponse = await fetch(`${API_BASE_URL}/usuarios/${id}`);
            const user = await userResponse.json();
            users[id] = user;
        }
        
        // Combinar asistencias con datos de usuario
        return attendances
            .map(a => {
                const user = users[a.id_usuario] || {};
                return {
                    fecha: a.fecha,
                    hora: a.hora,
                    carnet: user.carnet || 'N/A', 
                    nombre: user.nombre_completo || 'Usuario Desconocido',
                    telefono: user.telefono || 'N/A',
                    correo: user.correo_electronico || 'N/A',
                    carrera: user.carrera || 'N/A',
                };
            })
            // Ordenamos por fecha y hora para que el documento sea legible
            .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

    } catch (error) {
        console.error('Error al obtener datos para el documento:', error);
        return [];
    }
}


/**
 * 3. Genera y descarga el documento PDF.
 * @param {string} instructorName - Nombre del tutor logueado.
 * @param {Array<Object>} attendanceData - Datos de asistencia combinados.
 */
function generatePdf(instructorName, attendanceData) {
    // Inicializa jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'letter'); // Carta (Letter size), milímetros

    // --- Definición de Estilos ---
    doc.setFont('helvetica');

    // --- Título del Documento ---
    doc.setFontSize(14);
    doc.text('Registro de Asistencia de Sesiones Presenciales', 105, 20, null, null, 'center');
    
    // --- Metadatos de la Sesión ---
    doc.setFontSize(10);
    const yStart = 30;

    // Nombre del proyecto y campus
    doc.text(`Nombre del Proyecto: Tutorías con alumnos híbridas Campus Antiguo Cuscatlán`, 20, yStart);
    
    // Instructor
    doc.text(`Instructor: ${instructorName || 'Tutor Desconocido'}`, 20, yStart + 6);
    
    // Título de la sección
    doc.text(`Registro generado el: ${new Date().toLocaleDateString('es-SV')}`, 20, yStart + 12);
    
    // --- Preparación de la Tabla ---
    const tableHeaders = [
        ['Fecha', 'Hora', 'Carnet', 'Nombre y Apellido', 'Carrera', 'Teléfono', 'Correo']
    ];

    const tableRows = attendanceData.map(item => [
        item.fecha,
        item.hora,
        item.carnet,
        item.nombre,
        item.carrera,
        item.telefono,
        item.correo,
    ]);

    // Usar jspdf-autotable
    doc.autoTable({
        head: tableHeaders,
        body: tableRows,
        startY: yStart + 20,
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [55, 48, 163], textColor: [255, 255, 255] }, // Un color azul oscuro (indigo-700)
        margin: { top: 10, left: 20, right: 20 },
        columnStyles: {
            0: { cellWidth: 15 }, // Fecha
            1: { cellWidth: 15 }, // Hora
            2: { cellWidth: 20 }, // Carnet
            3: { cellWidth: 40 }, // Nombre
            4: { cellWidth: 25 }, // Carrera
            5: { cellWidth: 20 }, // Teléfono
            6: { cellWidth: 40 }, // Correo
        }
    });

    // --- Descarga ---
    const sessionTitleElement = document.getElementById('session-title');
    const filename = (sessionTitleElement ? sessionTitleElement.textContent.trim() : 'Documento') + '_Asistencia.pdf';
    doc.save(filename);
}


// --- PUNTO DE ENTRADA ---
document.addEventListener('DOMContentLoaded', () => {
    const printButton = document.getElementById('print-list-btn');

    if (printButton) {
        printButton.addEventListener('click', async () => {
            const { sessionId, tutorName, userRole } = getDocumentData();

            if (!sessionId) {
                alert('Error: No se encontró el ID de la sesión. Asegúrate de que el ID está en localStorage.');
                return;
            }
            if (userRole !== 'tutor') {
                alert('Solo los tutores pueden generar este documento.');
                return;
            }

            // Deshabilitar botón temporalmente para UX
            printButton.disabled = true;
            printButton.textContent = 'Generando...';

            try {
                const attendanceData = await fetchAttendanceData(sessionId);
                if (attendanceData.length === 0) {
                    alert('No hay asistencias registradas para generar el documento.');
                } else {
                    generatePdf(tutorName, attendanceData);
                }
            } catch (e) {
                console.error("Fallo al generar el PDF:", e);
                alert('Ocurrió un error al generar el PDF.');
            } finally {
                // Restaurar botón
                printButton.disabled = false;
                printButton.innerHTML = '<i class="ti ti-printer text-lg mr-2"></i> Imprimir Lista (PDF)';
            }
        });
    }
});