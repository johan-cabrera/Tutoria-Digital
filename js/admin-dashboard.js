
// --- FUNCIONES DE CÁLCULO ---

/**
 * Carga todos los datos necesarios para el dashboard.
 * @async
 * @returns {Promise<Object>} Un objeto con usuarios, sesiones y asistencias.
 */
async function fetchAllData() {
    try {
        const [usersResponse, sessionsResponse, attendanceResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/usuarios`),
            fetch(`${API_BASE_URL}/sesiones`),
            fetch(`${API_BASE_URL}/asistencias`)
        ]);

        if (!usersResponse.ok || !sessionsResponse.ok || !attendanceResponse.ok) {
            throw new Error("Fallo al cargar uno o más recursos de la API.");
        }

        const usuarios = await usersResponse.json();
        const sesiones = await sessionsResponse.json();
        const asistencias = await attendanceResponse.json();

        return { usuarios, sesiones, asistencias };

    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        // Podrías agregar una función para mostrar un mensaje de error en la UI aquí
        return { usuarios: [], sesiones: [], asistencias: [] };
    }
}

/**
 * Calcula las métricas clave (KPIs) del sistema.
 * @param {Array<Object>} usuarios - Lista de todos los usuarios.
 * @param {Array<Object>} sesiones - Lista de todas las sesiones.
 * @param {Array<Object>} asistencias - Lista de todas las asistencias.
 * @returns {Object} Un objeto con los valores de los KPIs.
 */
function calculateMetrics(usuarios, sesiones, asistencias) {
    // KPI 1: Total Estudiantes (Rol 'estudiante' o 'tutor')
    const studentUsers = usuarios.filter(u => u.rol === 'tutor' || u.rol === 'estudiante');
    const totalEstudiantes = studentUsers.length;

    // KPI 2: Sesiones Programadas (Total de sesiones en la base de datos)
    const sesionesProgramadas = sesiones.length;
    
    // KPI 3: Tutores Activos (Rol 'tutor')
    const tutoresActivos = usuarios.filter(u => u.rol === 'tutor').length;

    // KPI 4: Tasa Asistencia Global 
    // Numerador: Total de estudiantes ÚNICOS que han asistido (de asistencias)
    const uniqueAttendeesCount = [...new Set(asistencias.map(a => a.id_usuario))].length;
    
    // Denominador: Suma de 'estudiantes_activos' de TODAS las sesiones
    const totalEstudiantesActivosInSessions = sesiones.reduce((sum, s) => sum + (s.estudiantes_activos || 0), 0);
    
    const tasaAsistencia = totalEstudiantesActivosInSessions > 0
                           ? ((uniqueAttendeesCount / totalEstudiantesActivosInSessions) * 100)
                           : 0;

    return {
        totalEstudiantes: totalEstudiantes,
        sesionesProgramadas: sesionesProgramadas,
        tutoresActivos: tutoresActivos,
        tasaAsistencia: tasaAsistencia.toFixed(1) // Redondeado a un decimal para presentación
    };
}


// --- FUNCIÓN DE RENDERIZADO ---

/**
 * Actualiza la interfaz de usuario con los KPIs calculados.
 * @param {Object} metrics - Objeto que contiene los valores de los KPIs.
 */
function updateKPIs(metrics) {
    // 1. Total Estudiantes
    const totalEstudiantesEl = document.getElementById('total-estudiantes');
    if (totalEstudiantesEl) {
        totalEstudiantesEl.textContent = metrics.totalEstudiantes.toLocaleString('es-ES');
    }

    // 2. Sesiones Programadas
    const sesionesMesEl = document.getElementById('sesiones-mes');
    if (sesionesMesEl) {
        sesionesMesEl.textContent = metrics.sesionesProgramadas.toLocaleString('es-ES');
    }

    // 3. Tasa Asistencia Global
    const tasaAsistenciaEl = document.getElementById('tasa-asistencia');
    if (tasaAsistenciaEl) {
        tasaAsistenciaEl.textContent = `${metrics.tasaAsistencia}%`;
    }

    // 4. Tutores Activos
    const tutoresActivosEl = document.getElementById('tutores-activos');
    if (tutoresActivosEl) {
        tutoresActivosEl.textContent = metrics.tutoresActivos.toLocaleString('es-ES');
    }
}


// --- PUNTO DE ENTRADA ---

/**
 * Inicializa el dashboard administrativo.
 */
async function initAdminDashboard() {
    const { usuarios, sesiones, asistencias } = await fetchAllData();
    
    if (usuarios.length > 0) {
        const metrics = calculateMetrics(usuarios, sesiones, asistencias);
        updateKPIs(metrics);
        console.log('Métricas del Dashboard calculadas:', metrics);
    } else {
        console.log('No se pudieron cargar los datos. El dashboard no se actualizó.');
    }
}

// Iniciar al cargar el DOM
document.addEventListener('DOMContentLoaded', initAdminDashboard);