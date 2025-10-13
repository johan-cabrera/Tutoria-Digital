// =======================================================
// === 1. DEFINICIÓN DE CONSTANTES Y CONFIGURACIÓN =======
// =======================================================


const PRIMARY_BLUE = '#2563EB';  // blue-600
const ACCENT_GREEN = '#059669';  // emerald-600
const ACCENT_YELLOW = '#D97706'; // amber-700
const ACCENT_RED = '#DC2626';    // red-600

let allData = {}; // Almacena todos los datos crudos (usuarios, sesiones, asistencias)

// =======================================================
// === 2. FUNCIONES DE UTILIDAD PARA GRÁFICOS (Chart.js) ==
// =======================================================

/**
 * Función genérica para crear y configurar un gráfico Chart.js.
 */
const createChart = (ctxId, type, data, options) => {
    const ctx = document.getElementById(ctxId);
    if (ctx) {
        if (Chart.getChart(ctx)) {
            Chart.getChart(ctx).destroy();
        }
        new Chart(ctx, { type, data, options });
    }
};

/**
 * Renderiza todos los gráficos usando los datos calculados.
 */
const renderCharts = (chartData) => {
    // 1. Tasa de Asistencia por Materia (Bar Chart)
    createChart('subjectAttendanceChart', 'bar', {
        labels: chartData.subjectAttendance.labels,
        datasets: [{
            label: 'Total Asistencias',
            data: chartData.subjectAttendance.data,
            backgroundColor: PRIMARY_BLUE,
            borderColor: PRIMARY_BLUE,
            borderWidth: 1
        }]
    }, { 
        responsive: true, 
        maintainAspectRatio: false, 
        scales: { 
            y: { beginAtZero: true } 
        } 
    });

    // 2. Asistencia por Día de la Semana (Bar Chart)
    createChart('dayOfWeekChart', 'bar', {
        labels: chartData.dayOfWeek.labels,
        datasets: [{
            label: 'Total Asistencias',
            data: chartData.dayOfWeek.data,
            backgroundColor: ACCENT_GREEN,
            borderColor: ACCENT_GREEN,
            borderWidth: 1
        }]
    }, { 
        responsive: true, 
        maintainAspectRatio: false, 
        scales: { y: { beginAtZero: true } } 
    });

    // 3. Distribución de Asistencia por Hora del Día (Line Chart)
    createChart('peakHourChart', 'line', {
        labels: chartData.peakHour.labels,
        datasets: [{
            label: 'Estudiantes Registrados',
            data: chartData.peakHour.data,
            borderColor: ACCENT_YELLOW,
            backgroundColor: 'rgba(217, 119, 6, 0.2)', 
            fill: true,
            tension: 0.4
        }]
    }, { 
        responsive: true, 
        maintainAspectRatio: false, 
        scales: { y: { beginAtZero: true } } 
    });

    // 4. Tasa de Asistencia por Tutor (Horizontal Bar Chart)
    createChart('tutorSessionsChart', 'bar', {
        labels: chartData.tutorPerformance.labels,
        datasets: [{
            label: 'Asistencias por Sesión (Promedio)',
            data: chartData.tutorPerformance.data,
            backgroundColor: ACCENT_RED,
            borderColor: ACCENT_RED,
            borderWidth: 1
        }]
    }, { 
        indexAxis: 'y', 
        responsive: true, 
        maintainAspectRatio: false, 
        scales: { x: { beginAtZero: true } } 
    });
};

/**
 * Actualiza las tarjetas KPI con los datos calculados.
 */
const updateKPIs = (kpis) => {
    document.getElementById('kpi-attendance-rate').textContent = `${kpis.attendanceRate}%`;
    
    // Sesión Más Asistida
    document.getElementById('kpi-most-active-session').textContent = kpis.mostActiveSession.name || 'N/A';
    document.getElementById('kpi-active-count').textContent = kpis.mostActiveSession.count || 0;

    // Mejor Tutor
    document.getElementById('kpi-top-tutor').textContent = kpis.topTutor.name || 'N/A';
    document.getElementById('kpi-top-tutor-rate').textContent = `${kpis.topTutor.averageAttendance.toFixed(1)}%`;

    // Materia con Menor Asistencia (MODIFICADO para incluir el porcentaje)
    document.getElementById('kpi-least-demanded-subject').textContent = kpis.leastDemandedSubject.name || 'N/A';
    
    // Actualizar el porcentaje de la materia menos demandada
    const leastDemandedRateElement = document.getElementById('kpi-least-demanded-subject-rate');
    if (leastDemandedRateElement) {
        // Se asume que kpis.leastDemandedSubject.rate ya existe en la salida de calculateMetrics
        // (Aunque lo implementaremos con un cálculo de porcentaje simple en el paso 3)
        leastDemandedRateElement.textContent = `${kpis.leastDemandedSubject.rate.toFixed(1)}%`;
    }
};

/**
 * Actualiza la tabla de Métricas por Carrera.
 */
const updateCareerTable = (tableData) => {
    const tableBody = document.getElementById('career-metrics-body');
    if (!tableBody) return;

    tableBody.innerHTML = tableData.map(row => {
        // Determinamos el color en función de la frecuencia (ejemplo)
        const frequency = parseFloat(row.frequency);
        let colorClass = 'text-text-light';
        if (frequency >= 4) {
            colorClass = 'text-accent-green font-semibold';
        } else if (frequency >= 2) {
            colorClass = 'text-yellow-600 font-semibold';
        } else {
            colorClass = 'text-accent-red font-semibold';
        }

        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-dark">${row.carrera}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-text-light">${row.uniqueAttendees}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-text-light">${row.totalAsistencias}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${colorClass}">${frequency.toFixed(2)} veces</td>
            </tr>
        `;
    }).join('');
};


// =======================================================
// === 3. LÓGICA DE DATOS Y PROCESAMIENTO ================
// =======================================================

/**
 * Carga todos los datos de la API.
 */
const fetchAllData = async () => {
    // URL base de la API debe estar definida en algún lugar, la añadiremos aquí para que sea funcional.
    const API_BASE_URL = 'https://tutoria-digital.onrender.com';
    try {
        const [usuarios, sesiones, asistencias] = await Promise.all([
            fetch(`${API_BASE_URL}/usuarios`).then(res => res.json()),
            fetch(`${API_BASE_URL}/sesiones`).then(res => res.json()),
            fetch(`${API_BASE_URL}/asistencias`).then(res => res.json())
        ]);

        allData = { usuarios, sesiones, asistencias };
        
        // Inicializar el filtro de Materias al cargar los datos
        populateSubjectFilter(sesiones);

        // Renderizar por primera vez sin filtros de fecha
        const initialFilters = { dateStart: '', dateEnd: '', filterSubject: '' };
        await processData(initialFilters);

    } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
        // Mostrar mensaje de error en la UI si es necesario
    }
};

/**
 * Rellena el select de Materias con opciones únicas.
 */
const populateSubjectFilter = (sesiones) => {
    const select = document.getElementById('filter-subject');
    if (!select) return; // Añadido check de seguridad
    const uniqueSubjects = [...new Set(sesiones.map(s => s.materia))].sort();

    // Limpiar opciones previas (manteniendo "Todas las Materias")
    select.innerHTML = '<option value="">Todas las Materias</option>';

    uniqueSubjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        select.appendChild(option);
    });
};

/**
 * Función principal para filtrar y calcular todas las métricas.
 */
const processData = async (filters) => {
    if (!allData.asistencias) {
        // Si no hay datos, intentar cargarlos.
        await fetchAllData();
        if (!allData.asistencias) return;
    }
    if (allData.asistencias.length === 0) return;

    const { usuarios, sesiones, asistencias } = allData;
    const dateStart = filters.dateStart ? new Date(filters.dateStart + 'T00:00:00') : null;
    const dateEnd = filters.dateEnd ? new Date(filters.dateEnd + 'T23:59:59') : null; // Ajuste para incluir el día completo

    // 1. FILTRADO DE ASISTENCIAS
    let filteredAsistencias = asistencias.filter(a => {
        const assistanceDate = new Date(a.fecha);
        const session = sesiones.find(s => s.id == a.id_sesion);

        // Filtrar por rango de fechas
        const isDateValid = (!dateStart || assistanceDate >= dateStart) && 
                            (!dateEnd || assistanceDate <= dateEnd);

        // Filtrar por Materia
        const isSubjectValid = !filters.filterSubject || (session && session.materia === filters.filterSubject);
        
        return isDateValid && isSubjectValid;
    });

    // 2. CALCULAR METRICAS
    const calculated = calculateMetrics(usuarios, sesiones, filteredAsistencias);

    // 3. ACTUALIZAR UI
    updateKPIs(calculated.kpis);
    renderCharts(calculated.chartData);
    updateCareerTable(calculated.tableData);
};


// LÓGICA DE CÁLCULO DE MÉTRICAS (A J U S T A D A)
const calculateMetrics = (usuarios, sesiones, asistencias) => {
    const studentUsers = usuarios.filter(u => u.rol !== 'profesor');
    const totalActiveStudents = sesiones.reduce((sum, s) => sum + (s.estudiantes_activos || 0), 0);

    // --- KPIs (Key Performance Indicators) ---
    const uniqueAttendees = [...new Set(asistencias.map(a => a.id_usuario))];
    const totalAsistenciasGlobal = asistencias.length;
    
    // KPI 1: Tasa de Participación
    const attendanceRate = totalActiveStudents > 0 ? 
                           ((uniqueAttendees.length / totalActiveStudents) * 100) : 0;
    
    // KPI 2: Sesión Más Asistida
    const sessionCounts = asistencias.reduce((acc, a) => {
        acc[a.id_sesion] = (acc[a.id_sesion] || 0) + 1;
        return acc;
    }, {});
    const mostActiveSessionId = Object.keys(sessionCounts).reduce((a, b) => sessionCounts[a] > sessionCounts[b] ? a : b, null);
    const mostActiveSession = mostActiveSessionId 
        ? {
            name: sesiones.find(s => s.id == mostActiveSessionId)?.materia,
            count: sessionCounts[mostActiveSessionId]
        }
        : { name: 'N/A', count: 0 };

    // KPI 3 & 4: Tutor y Materia Performance
    const tutorStats = {};
    const subjectStats = {}; // { 'Algebra': 15, 'Calculo': 5, ... }

    asistencias.forEach(a => {
        const session = sesiones.find(s => s.id == a.id_sesion);
        if (!session) return;
        
        const tutorId = session.id_tutor;
        const subject = session.materia;

        // Tutor Stats
        tutorStats[tutorId] = tutorStats[tutorId] || { totalAttendance: 0, sessions: new Set() };
        tutorStats[tutorId].totalAttendance += 1;
        tutorStats[tutorId].sessions.add(session.id);

        // Subject Stats
        subjectStats[subject] = (subjectStats[subject] || 0) + 1;
    });
    
    // KPI 3: Mejor Tutor
    const tutorsWithAverage = Object.keys(tutorStats).map(id => {
        const stats = tutorStats[id];
        const tutor = usuarios.find(u => u.id == id);
        const sessionCount = stats.sessions.size;
        const averageAttendance = stats.totalAttendance / sessionCount;
        return { 
            name: tutor ? tutor.nombre_completo : `Tutor ${id}`, 
            averageAttendance: averageAttendance
        };
    }).sort((a, b) => b.averageAttendance - a.averageAttendance);
    
    const topTutor = tutorsWithAverage.length > 0 
        ? { name: tutorsWithAverage[0].name, averageAttendance: tutorsWithAverage[0].averageAttendance } 
        : { name: 'N/A', averageAttendance: 0 };
    
    // KPI 4: Materia con Menor Asistencia (A J U S T A D O)
    const leastDemandedSubjectName = Object.keys(subjectStats).reduce((a, b) => 
        subjectStats[a] < subjectStats[b] ? a : b, null
    );
    const leastDemandedCount = subjectStats[leastDemandedSubjectName] || 0;
    
    // Calculamos el porcentaje de asistencias de esa materia sobre el TOTAL GLOBAL
    const leastDemandedRate = totalAsistenciasGlobal > 0 ? (leastDemandedCount / totalAsistenciasGlobal) * 100 : 0;
    
    const leastDemandedSubject = { 
        name: leastDemandedSubjectName || 'N/A', 
        rate: leastDemandedRate, // NUEVO: Tasa en porcentaje
        count: leastDemandedCount
    };

    // --- Chart Data ---
    const topSubjects = Object.entries(subjectStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const tutorChartData = tutorsWithAverage.slice(0, 5);

    const getDayOfWeek = (dateString) => {
        const date = new Date(dateString + 'T00:00:00');
        return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()];
    };

    const dayOfWeekCounts = asistencias.reduce((acc, a) => {
        const day = getDayOfWeek(a.fecha);
        acc[day] = (acc[day] || 0) + 1;
        return acc;
    }, {});
    
    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const dayOfWeekChart = {
        labels: dayLabels,
        data: dayLabels.map(day => dayOfWeekCounts[day] || 0)
    };

    const peakHourCounts = asistencias.reduce((acc, a) => {
        const hour = new Date(`2000/01/01 ${a.hora}`).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
    }, {});

    const hourLabels = Array.from({ length: 13 }, (_, i) => i + 8);
    const peakHourChart = {
        labels: hourLabels.map(h => `${h % 12 || 12} ${h < 12 || h === 24 ? 'am' : 'pm'}`),
        data: hourLabels.map(h => peakHourCounts[h] || 0)
    };
    
    // --- Table Data (Frecuencia por Carrera) ---
    const careerStats = studentUsers.reduce((acc, u) => {
        acc[u.carrera] = acc[u.carrera] || { uniqueAttendees: new Set(), totalAsistencias: 0 };
        return acc;
    }, {});

    asistencias.forEach(a => {
        const user = usuarios.find(u => u.id == a.id_usuario);
        if (user) {
            careerStats[user.carrera].uniqueAttendees.add(user.id);
            careerStats[user.carrera].totalAsistencias += 1;
        }
    });

    const tableData = Object.keys(careerStats).map(carrera => {
        const stats = careerStats[carrera];
        const uniqueCount = stats.uniqueAttendees.size;
        const totalAsistencias = stats.totalAsistencias;
        const frequency = uniqueCount > 0 ? totalAsistencias / uniqueCount : 0;

        return {
            carrera,
            uniqueAttendees: uniqueCount,
            totalAsistencias,
            frequency: frequency.toFixed(2)
        };
    }).sort((a, b) => b.frequency - a.frequency);


    return {
        kpis: {
            attendanceRate: attendanceRate.toFixed(1),
            mostActiveSession,
            topTutor,
            leastDemandedSubject
        },
        chartData: {
            subjectAttendance: { labels: topSubjects.map(([l]) => l), data: topSubjects.map(([, d]) => d) },
            dayOfWeek: dayOfWeekChart,
            peakHour: peakHourChart,
            tutorPerformance: { labels: tutorChartData.map(t => t.name), data: tutorChartData.map(t => t.averageAttendance) }
        },
        tableData
    };
};


// =======================================================
// === 4. INICIALIZACIÓN DEL SCRIPT ======================
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
    const applyFiltersButton = document.getElementById('apply-filters');
    
    // Carga inicial de todos los datos
    fetchAllData(); 

    // Manejar el evento de aplicar filtros
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', () => {
            // Obtenemos los valores de las nuevas entradas de fecha y el select de materia
            const dateStart = document.getElementById('date-start').value;
            const dateEnd = document.getElementById('date-end').value;
            const filterSubject = document.getElementById('filter-subject').value;

            const filters = { dateStart, dateEnd, filterSubject };
            
            console.log("Filtros aplicados:", filters);
            processData(filters); // Vuelve a cargar y procesar los datos con los filtros
        });
    }
});