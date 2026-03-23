// Configuración de Supabase
const SUPABASE_URL = 'https://prenermnmqexgzpbmcfm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByZW5lcm5tbnFleGd6cGJtY2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjc1NTQsImV4cCI6MjA4OTgwMzU1NH0.VfxRvPnNRv5yXG0SabqPgU8tVH4pEbj7D6YRuNcSTL8';

// Cliente de Supabase
let supabaseClient = null;

// Datos locales
let envios = [];
let mensajeros = [];

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'success', titulo = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const iconos = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const titulos = { success: 'Éxito', error: 'Error', info: 'Información', warning: 'Advertencia' };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `
        <div class="toast-icon">${iconos[tipo] || 'ℹ️'}</div>
        <div class="toast-content">
            <div class="toast-title">${titulo || titulos[tipo]}</div>
            <div class="toast-message">${mensaje}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

// Inicializar Supabase
async function initSupabase() {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await cargarEnvios();
    await cargarMensajeros();
    mostrarTabla();
    actualizarGraficos();
}

// Cargar envíos desde Supabase
async function cargarEnvios() {
    try {
        const { data, error } = await supabaseClient
            .from('envios')
            .select('*')
            .order('id', { ascending: false });
        
        if (error) throw error;
        envios = data || [];
        console.log(`📦 Cargados ${envios.length} envíos desde la nube`);
    } catch (error) {
        console.error('Error al cargar envíos:', error);
        mostrarNotificacion('Error al conectar con la nube. Usando datos locales.', 'error', 'Error de conexión');
        cargarEnviosLocal();
    }
}

// Cargar mensajeros desde Supabase
async function cargarMensajeros() {
    try {
        const { data, error } = await supabaseClient
            .from('mensajeros')
            .select('*')
            .order('codigo');
        
        if (error) throw error;
        mensajeros = data || [];
        console.log(`👤 Cargados ${mensajeros.length} mensajeros desde la nube`);
    } catch (error) {
        console.error('Error al cargar mensajeros:', error);
        cargarMensajerosLocal();
    }
}

// Backup local
function cargarEnviosLocal() {
    const datos = localStorage.getItem('enviaTrack_envios');
    if (datos) envios = JSON.parse(datos);
}

function cargarMensajerosLocal() {
    const datos = localStorage.getItem('enviaTrack_mensajeros');
    if (datos) mensajeros = JSON.parse(datos);
}

// Guardar en Supabase
async function guardarEnvio(envio) {
    try {
        const { error } = await supabaseClient
            .from('envios')
            .upsert(envio);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error al guardar:', error);
        mostrarNotificacion('Error al guardar en la nube', 'error', 'Error');
    }
}

async function eliminarEnvioDB(id) {
    try {
        const { error } = await supabaseClient
            .from('envios')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
    } catch (error) {
        console.error('Error al eliminar:', error);
        mostrarNotificacion('Error al eliminar de la nube', 'error', 'Error');
    }
}

// Función para normalizar texto
function normalizarTexto(texto) {
    return texto.toLowerCase()
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/ü/g, 'u');
}

// Mostrar tabla de envíos
function mostrarTabla() {
    const contenedor = document.getElementById('tabla-envios');
    if (!contenedor) return;
    
    let texto = normalizarTexto(document.getElementById('buscador')?.value || '');
    let filtrados = envios;
    
    if (texto !== '') {
        filtrados = envios.filter(e => {
            let destinatarioNorm = normalizarTexto(e.destinatario);
            let direccionNorm = normalizarTexto(e.direccion);
            return destinatarioNorm.includes(texto) || direccionNorm.includes(texto);
        });
    }
    
    let html = `<table style="width:100%; border-collapse:collapse;"><thead style="background:#333; color:white;"><tr>
        <th style="padding:10px;">ID</th><th style="padding:10px;">Destinatario</th><th style="padding:10px;">Dirección</th>
        <th style="padding:10px;">Teléfono</th><th style="padding:10px;">Estado</th><th style="padding:10px;">Mensajero</th>
        <th style="padding:10px;">Fecha Creación</th><th style="padding:10px;">Fecha Entrega</th><th style="padding:10px;">Acciones</th>
    </tr></thead><tbody>`;
    
    for (let e of filtrados) {
        let estadoText = { 'pendiente': '⏳ Pendiente', 'en_ruta': '🚚 En ruta', 'entregado': '✅ Entregado' };
        let estadoClass = { 'pendiente': 'estado-pendiente', 'en_ruta': 'estado-en-ruta', 'entregado': 'estado-entregado' };
        
        let botones = '';
        if (e.estado === 'pendiente') {
            botones = `<button onclick="iniciarRuta(${e.id})" style="background:#3498db; color:white; padding:5px 10px; margin-right:5px; border:none; border-radius:3px;">🚚 Iniciar Ruta</button>`;
            botones += `<button onclick="eliminarEnvio(${e.id})" style="background:#e74c3c; color:white; padding:5px 10px; border:none; border-radius:3px;">🗑️ Eliminar</button>`;
        } else if (e.estado === 'en_ruta') {
            botones = `<button onclick="marcarEntregado(${e.id})" style="background:#27ae60; color:white; padding:5px 10px; margin-right:5px; border:none; border-radius:3px;">✅ Marcar Entregado</button>`;
            botones += `<button onclick="eliminarEnvio(${e.id})" style="background:#e74c3c; color:white; padding:5px 10px; border:none; border-radius:3px;">🗑️ Eliminar</button>`;
        } else {
            botones = `<span style="color:#27ae60;">✓ Completado</span>`;
            botones += `<button onclick="eliminarEnvio(${e.id})" style="background:#e74c3c; color:white; padding:5px 10px; margin-left:5px; border:none; border-radius:3px;">🗑️ Eliminar</button>`;
        }
        
        html += `<tr style="border-bottom:1px solid #ddd;">
            <td style="padding:8px; text-align:center;">${e.id}</td>
            <td style="padding:8px;">${e.destinatario}</td>
            <td style="padding:8px;">${e.direccion}</td>
            <td style="padding:8px;">${e.telefono}</td>
            <td style="padding:8px;" class="${estadoClass[e.estado]}">${estadoText[e.estado]}</td>
            <td style="padding:8px;">${e.mensajero || 'Sin asignar'}</td>
            <td style="padding:8px;">${e.fecha_creacion ? new Date(e.fecha_creacion).toLocaleString() : e.fechaCreacion || '—'}</td>
            <td style="padding:8px;">${e.fecha_entrega ? new Date(e.fecha_entrega).toLocaleString() : e.fechaEntrega || '—'}</td>
            <td style="padding:8px; text-align:center;">${botones}</td>
        </tr>`;
    }
    
    html += `</tbody></table>`;
    
    if (filtrados.length === 0) {
        html = '<p style="text-align:center; padding:20px;">No hay envíos</p>';
    }
    
    contenedor.innerHTML = html;
    
    let pend = envios.filter(e => e.estado === 'pendiente').length;
    let ruta = envios.filter(e => e.estado === 'en_ruta').length;
    let entre = envios.filter(e => e.estado === 'entregado').length;
    
    const p1 = document.getElementById('contador-pendiente');
    const p2 = document.getElementById('contador-en-ruta');
    const p3 = document.getElementById('contador-entregado');
    const p4 = document.getElementById('contador-total');
    
    if (p1) p1.textContent = pend;
    if (p2) p2.textContent = ruta;
    if (p3) p3.textContent = entre;
    if (p4) p4.textContent = envios.length;
    
    actualizarGraficos();
}

// Gráficos
let graficoEstados = null;
let graficoEntregas = null;

function actualizarGraficos() {
    const pendientes = envios.filter(e => e.estado === 'pendiente').length;
    const enRuta = envios.filter(e => e.estado === 'en_ruta').length;
    const entregados = envios.filter(e => e.estado === 'entregado').length;
    
    const ctxEstados = document.getElementById('graficoEstados');
    if (ctxEstados && typeof Chart !== 'undefined') {
        if (graficoEstados) graficoEstados.destroy();
        graficoEstados = new Chart(ctxEstados, {
            type: 'doughnut',
            data: {
                labels: ['Pendientes', 'En Ruta', 'Entregados'],
                datasets: [{ data: [pendientes, enRuta, entregados], backgroundColor: ['#f39c12', '#3498db', '#27ae60'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
        });
    }
    
    const ultimos7Dias = [];
    const entregasPorDia = [];
    
    for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toLocaleDateString();
        ultimos7Dias.push(fechaStr);
        
        const entregasDia = envios.filter(e => {
            if (!e.fecha_entrega && !e.fechaEntrega) return false;
            const fechaEntrega = new Date(e.fecha_entrega || e.fechaEntrega);
            return fechaEntrega.toLocaleDateString() === fechaStr;
        }).length;
        entregasPorDia.push(entregasDia);
    }
    
    const ctxEntregas = document.getElementById('graficoEntregas');
    if (ctxEntregas && typeof Chart !== 'undefined') {
        if (graficoEntregas) graficoEntregas.destroy();
        graficoEntregas = new Chart(ctxEntregas, {
            type: 'line',
            data: {
                labels: ultimos7Dias,
                datasets: [{ label: 'Entregas realizadas', data: entregasPorDia, borderColor: '#27ae60', backgroundColor: 'rgba(39, 174, 96, 0.1)', tension: 0.3, fill: true }]
            },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }
}

// Acciones
async function iniciarRuta(id) {
    let e = envios.find(x => x.id === id);
    if (e) {
        e.estado = 'en_ruta';
        if (!e.mensajero) e.mensajero = 'Mensajero Asignado';
        await guardarEnvio(e);
        await cargarEnvios();
        mostrarTabla();
        mostrarNotificacion(`Envío #${id} está en RUTA`, 'info', 'Ruta iniciada');
    }
}

async function marcarEntregado(id) {
    let e = envios.find(x => x.id === id);
    if (e) {
        e.estado = 'entregado';
        e.fecha_entrega = new Date().toISOString();
        await guardarEnvio(e);
        await cargarEnvios();
        mostrarTabla();
        mostrarNotificacion(`Envío #${id} entregado a ${e.destinatario}`, 'success', 'Entrega completada');
    }
}

async function eliminarEnvio(id) {
    let e = envios.find(x => x.id === id);
    if (e && confirm(`¿Eliminar envío #${id} de ${e.destinatario}?`)) {
        await eliminarEnvioDB(id);
        await cargarEnvios();
        mostrarTabla();
        mostrarNotificacion(`Envío #${id} eliminado`, 'warning', 'Eliminado');
    }
}

async function agregarEnvio() {
    let dest = document.getElementById('destinatario').value;
    let dir = document.getElementById('direccion').value;
    let tel = document.getElementById('telefono').value;
    
    if (!dest || !dir || !tel) {
        mostrarNotificacion('Completa todos los campos', 'warning', 'Campos incompletos');
        return false;
    }
    
    let nuevoId = envios.length > 0 ? Math.max(...envios.map(e => e.id)) + 1 : 1;
    
    let nuevo = {
        id: nuevoId,
        destinatario: dest,
        direccion: dir,
        telefono: tel,
        estado: 'pendiente',
        mensajero: null,
        fecha_creacion: new Date().toISOString()
    };
    
    await guardarEnvio(nuevo);
    await cargarEnvios();
    mostrarTabla();
    
    document.getElementById('destinatario').value = '';
    document.getElementById('direccion').value = '';
    document.getElementById('telefono').value = '';
    
    mostrarNotificacion(`Envío #${nuevoId} registrado`, 'success', 'Envío creado');
    return false;
}

function filtrarEnvios() {
    mostrarTabla();
}

function exportarCSV() {
    let contenido = 'ID,Destinatario,Dirección,Teléfono,Estado,Mensajero,Fecha Creación,Fecha Entrega\n';
    for (let e of envios) {
        let estadoText = { 'pendiente': 'Pendiente', 'en_ruta': 'En Ruta', 'entregado': 'Entregado' };
        contenido += `${e.id},${e.destinatario},${e.direccion},${e.telefono},`;
        contenido += `${estadoText[e.estado]},${e.mensajero || 'Sin asignar'},${e.fecha_creacion || e.fechaCreacion || ''},${e.fecha_entrega || e.fechaEntrega || ''}\n`;
    }
    let blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `envios_${new Date().toLocaleDateString()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    mostrarNotificacion(`Exportados ${envios.length} envíos`, 'success', 'Exportación completa');
}

// Eventos y inicio
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-nuevo-envio');
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); agregarEnvio(); });
    
    const buscador = document.getElementById('buscador');
    if (buscador) buscador.addEventListener('input', filtrarEnvios);
    
    const btnExportar = document.getElementById('btn-exportar');
    if (btnExportar) btnExportar.addEventListener('click', exportarCSV);
    
    initSupabase();
});