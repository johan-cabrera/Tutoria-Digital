// ../js/inicio-data.js

document.addEventListener('DOMContentLoaded', () => {
    
    const sessionString = localStorage.getItem('currentUserSession');
    let currentUserId = null;
    
    const DOM = {
        totalSessions: document.getElementById('totalSessions'),
        totalStudents: document.getElementById('totalStudents'),
        totalHours: document.getElementById('totalHours'),
    };
    
    // Inicializar los campos con un indicador de carga
    Object.values(DOM).forEach(el => {
        if (el) el.textContent = '...';
    });

    if (sessionString) {
        try {
            currentUserId = JSON.parse(sessionString).id_usuario;
        } catch (error) {
            console.error("Error al obtener ID de usuario:", error);
        }
    }

    if (!currentUserId) {
        console.warn("Usuario no identificado. No se cargarán las métricas.");
        return;
    }

    /**
     * Carga y calcula las tres métricas clave (KPIs) para el dashboard
     * basándose en la nueva lógica centrada en las asistencias.
     */
    async function loadKpis(userId) {
        try {
            // 1. Obtener todas las sesiones y asistencias
            // Se necesitan las sesiones para saber qué asistencias corresponden al tutor.
            const API_BASE_URL = 'https://tutoria-digital.onrender.com';

            // 1. Obtener todas las sesiones y asistencias
            const [sessionsRes, attendanceRes] = await Promise.all([
                fetch(`${API_BASE_URL}/sesiones`), // Usamos la URL base aquí
                fetch(`${API_BASE_URL}/asistencias`) // Y aquí
            ]);

            if (!sessionsRes.ok || !attendanceRes.ok) {
                throw new Error("Fallo en una o más peticiones a la API (JSON Server no responde).");
            }

            const allSessions = await sessionsRes.json();
            const allAttendance = await attendanceRes.json();
            
            // 2. Identificar las IDs de las sesiones que pertenecen a este tutor
            const userSessionIds = allSessions
                .filter(s => s.id_tutor === userId)
                .map(s => s.id_sesion);

            // 3. Filtrar todas las asistencias para obtener solo las del tutor
            const userAttendanceRecords = allAttendance.filter(a => 
                userSessionIds.includes(a.id_sesion)
            );

            // --- CÁLCULO DE KPIS CON LA NUEVA LÓGICA ---

            // 1. Tutorías Impartidas (Cada fecha ÚNICA con asistencia)
            // Usamos un Set para obtener solo las fechas únicas de la asistencia del tutor.
            const uniqueDates = new Set(userAttendanceRecords.map(a => a.fecha));
            const totalSessionsCount = uniqueDates.size;

            // 2. Estudiantes Atendidos (Cantidad TOTAL de asistencias registradas)
            const totalStudentsCount = userAttendanceRecords.length;
            
            // 3. Horas Totales Invertidas (Tutorías Impartidas * 2)
            const totalHoursCount = totalSessionsCount * 2; 

            // --- ACTUALIZACIÓN DEL DOM ---
            
            if (DOM.totalSessions) DOM.totalSessions.textContent = totalSessionsCount;
            if (DOM.totalStudents) DOM.totalStudents.textContent = totalStudentsCount;
            if (DOM.totalHours) DOM.totalHours.textContent = totalHoursCount;

        } catch (error) {
            console.error('Error al cargar los KPIs:', error);
            Object.values(DOM).forEach(el => {
                if (el) el.textContent = 'N/A';
            });
        }
    }
    
    loadKpis(currentUserId);
});