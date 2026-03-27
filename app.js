// Configuración de Supabase
const SUPABASE_URL = 'https://prenermnmqexgzpbmcfm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByZW5lcm5tbnFleGd6cGJtY2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjc1NTQsImV4cCI6MjA4OTgwMzU1NH0.VfxRvPnNRv5yXG0SabqPgU8tVH4pEbj7D6YRuNcSTL8';

let supabaseClient = null;
let envios = [];
let usuarioActual = null;

// ========== AUTENTICACIÓN ==========

async function iniciarSesion() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        mostrarNotificacion('Completa todos los campos', 'warning', 'Campos incompletos');
        return;
    }
    
    mostrarNotificacion('Iniciando sesión...', 'info', 'Conectando');
    
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    if (error) {
        console.error('Error de login:', error);
        mostrarNotificacion('Email o contraseña incorrectos', 'error', 'Error de autenticación');
        return;
    }
    
    usuarioActual = data.user;
    localStorage.setItem('enviaTrack_user', JSON.stringify({ email: usuarioActual.email }));
    
    mostrarNotificacion(`Bienvenido ${usuarioActual.email}`, 'success', 'Sesión iniciada');
    
    // Ocultar login y mostrar panel
    document.getElementById('login-panel').style.display = 'none';
    document.getElementById('main-panel').style.display = 'block';
    
    // Cargar datos
    await cargarEnvios();
}

async function cerrarSesion() {
    await supabaseClient.auth.signOut();
    usuarioActual = null;
    localStorage.removeItem('enviaTrack_user');
    
    // Mostrar login y ocultar panel
    document.getElementById('login-panel').style.display = 'block';
    document.getElementById('main-panel').style.display = 'none';
    
    mostrarNotificacion('Sesión cerrada', 'info', 'Hasta luego');
}

async function verificarSesion() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        usuarioActual = session.user;
        document.getElementById('login-panel').style.display = 'none';
        document.getElementById('main-panel').style.display = 'block';
        await cargarEnvios();
    } else {
        document.getElementById('login-panel').style.display = 'block';
        document.getElementById('main-panel').style.display = 'none';
    }
}

// ========== FUNCIONES PRINCIPALES ==========

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

async function cargarEnvios() {
    try {
        const { data, error } = await supabaseClient
            .from('envios')
            .select('*')
            .order('id', { ascending: false });
        
        if (error) throw error;
        envios = data || [];
        console.log(`✅ Cargados ${envios.length} envíos desde la nube`);
        mostrarTabla();
        actualizarGraficos();
        actualizarContadores();
    } catch (error) {
        console.error('Error al cargar envíos:', error);
        mostrarNotificacion('Error de conexión con la nube', 'error', 'Error');
        envios = [];
        mostrarTabla();
    }
}

async function guardarEnvio(envio) {
    try {
        const { error } = await supabaseClient
            .from('envios')
            .upsert(envio);
        
        if (error) throw error;
        await cargarEnvios();
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
        await cargarEnvios();
    } catch (error) {
        console.error('Error al eliminar:', error);
        mostrarNotificacion('Error al eliminar de la nube', 'error', 'Error');
    }
}

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
    
    let html = `<table style="width:100%; border-collapse:collapse;"><thead style="background:#333; color:white;">$\n        <th style="padding:10px;">ID</th><th style="padding:10px;">Destinatario</th><th style="padding:10px;">Dirección</th>\n        <th style="padding:10px;">Teléfono</th><th style="padding:10px;">Estado</th><th style="padding:10px;">Mensajero</th>\n        <th style="padding:10px;">Fecha Creación</th><th style="padding:10px;">Fecha Entrega</th><th style="padding:10px;">Acciones</th>\n     </thead><tbody>`;
    
    for (let e of filtrados) {
        let estadoText = { 'pendiente': '⏳ Pendiente', 'en_ruta': '🚚 En ruta', 'entregado': '✅ Entregado' };
        let estadoClass = { 'pendiente': 'estado-pendiente', 'en_ruta': 'estado-en-ruta', 'entregado': 'estado-entregado' };
        
        let btnEditar = `<button onclick="editarEnvio(${e.id})" style="background:#f39c12; color:white; padding:5px 10px; margin-right:5px; border:none; border-radius:3px;">✏️ Editar</button>`;
        
        let botones = '';
        if (e.estado === 'pendiente') {
            botones = btnEditar;
            botones += `<button onclick="iniciarRuta(${e.id})" style="background:#3498db; color:white; padding:5px 10px; margin-right:5px; border:none; border-radius:3px;">🚚 Iniciar Ruta</button>`;
            botones += `<button onclick="eliminarEnvio(${e.id})" style="background:#e74c3c; color:white; padding:5px 10px; border:none; border-radius:3px;">🗑️ Eliminar</button>`;
        } else if (e.estado === 'en_ruta') {
            botones = btnEditar;
            botones += `<button onclick="marcarEntregado(${e.id})" style="background:#27ae60; color:white; padding:5px 10px; margin-right:5px; border:none; border-radius:3px;">✅ Marcar Entregado</button>`;
            botones += `<button onclick="eliminarEnvio(${e.id})" style="background:#e74c3c; color:white; padding:5px 10px; border:none; border-radius:3px;">🗑️ Eliminar</button>`;
        } else {
            botones = `<span style="color:#27ae60; margin-right:10px;">✓ Completado</span>`;
            botones += btnEditar;
            botones += `<button onclick="eliminarEnvio(${e.id})" style="background:#e74c3c; color:white; padding:5px 10px; margin-left:5px; border:none; border-radius:3px;">🗑️ Eliminar</button>`;
        }
        
        const fechaCreacion = e.fecha_creacion ? new Date(e.fecha_creacion).toLocaleString() : (e.fechaCreacion || '—');
        const fechaEntrega = e.fecha_entrega ? new Date(e.fecha_entrega).toLocaleString() : (e.fechaEntrega || '—');
        
        html += `<tr style="border-bottom:1px solid #ddd;">\n            <td style="padding:8px; text-align:center;">${e.id}</td>\n            <td style="padding:8px;">${e.destinatario}</td>\n            <td style="padding:8px;">${e.direccion}</td>\n            <td style="padding:8px;">${e.telefono}</td>\n            <td style="padding:8px;" class="${estadoClass[e.estado]}">${estadoText[e.estado]}</td>\n            <td style="padding:8px;">${e.mensajero || 'Sin asignar'}</td>\n            <td style="padding:8px;">${fechaCreacion}</td>\n            <td style="padding:8px;">${fechaEntrega}</td>\n            <td style="padding:8px; text-align:center;">${botones}</td>\n          </tr>`;
    }
    
    html += `</tbody></table>`;
    
    if (filtrados.length === 0 && envios.length === 0) {
        html = '<p style="text-align:center; padding:20px;">No hay envíos registrados</p>';
    } else if (filtrados.length === 0 && envios.length > 0) {
        html = '<p style="text-align:center; padding:20px;">No hay envíos que coincidan</p>';
    }
    
    contenedor.innerHTML = html;
}

function actualizarContadores() {
    let pend = envios.filter(e => e.estado === 'pendiente').length;
    let ruta = envios.filter(e => e.estado === 'en_ruta').length;
    let entre = envios.filter(e => e.estado === 'entregado').length;
    
    document.getElementById('contador-pendiente').textContent = pend;
    document.getElementById('contador-en-ruta').textContent = ruta;
    document.getElementById('contador-entregado').textContent = entre;
    document.getElementById('contador-total').textContent = envios.length;
}

let graficoEstados = null;
let graficoEntregas = null;

function actualizarGraficos() {
    if (typeof Chart === 'undefined') return;
    
    const pendientes = envios.filter(e => e.estado === 'pendiente').length;
    const enRuta = envios.filter(e => e.estado === 'en_ruta').length;
    const entregados = envios.filter(e => e.estado === 'entregado').length;
    
    const ctxEstados = document.getElementById('graficoEstados');
    if (ctxEstados) {
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
            const fechaEntrega = e.fecha_entrega || e.fechaEntrega;
            if (!fechaEntrega) return false;
            return new Date(fechaEntrega).toLocaleDateString() === fechaStr;
        }).length;
        entregasPorDia.push(entregasDia);
    }
    
    const ctxEntregas = document.getElementById('graficoEntregas');
    if (ctxEntregas) {
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

async function iniciarRuta(id) {
    let e = envios.find(x => x.id === id);
    if (e) {
        e.estado = 'en_ruta';
        if (!e.mensajero) e.mensajero = 'Mensajero Asignado';
        await guardarEnvio(e);
        mostrarNotificacion(`Envío #${id} está en RUTA`, 'info', 'Ruta iniciada');
    }
}

async function marcarEntregado(id) {
    let e = envios.find(x => x.id === id);
    if (e) {
        e.estado = 'entregado';
        e.fecha_entrega = new Date().toISOString();
        await guardarEnvio(e);
        mostrarNotificacion(`Envío #${id} entregado`, 'success', 'Entrega completada');
    }
}

async function eliminarEnvio(id) {
    let e = envios.find(x => x.id === id);
    if (e && confirm(`¿Eliminar envío #${id} de ${e.destinatario}?`)) {
        await eliminarEnvioDB(id);
        mostrarNotificacion(`Envío #${id} eliminado`, 'warning', 'Eliminado');
    }
}

async function editarEnvio(id) {
    const envio = envios.find(e => e.id === id);
    if (!envio) {
        mostrarNotificacion('Envío no encontrado', 'error', 'Error');
        return;
    }
    
    const nuevoDestinatario = prompt('Editar destinatario:', envio.destinatario);
    if (!nuevoDestinatario) return;
    
    const nuevaDireccion = prompt('Editar dirección:', envio.direccion);
    if (!nuevaDireccion) return;
    
    const nuevoTelefono = prompt('Editar teléfono:', envio.telefono);
    if (!nuevoTelefono) return;
    
    envio.destinatario = nuevoDestinatario;
    envio.direccion = nuevaDireccion;
    envio.telefono = nuevoTelefono;
    
    await guardarEnvio(envio);
    mostrarNotificacion(`Envío #${id} actualizado`, 'success', 'Editado');
}

async function agregarEnvio() {
    let dest = document.getElementById('destinatario').value;
    let dir = document.getElementById('direccion').value;
    let tel = document.getElementById('telefono').value;
    
    if (!dest || !dir || !tel) {
        mostrarNotificacion('Completa todos los campos', 'warning', 'Campos incompletos');
        return false;
    }
    
    let nuevoId = envios.length > 0 ? Math.max(...envios.map(e => e.id), 0) + 1 : 1;
    
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
        const fechaCreacion = e.fecha_creacion ? new Date(e.fecha_creacion).toLocaleString() : (e.fechaCreacion || '');
        const fechaEntrega = e.fecha_entrega ? new Date(e.fecha_entrega).toLocaleString() : (e.fechaEntrega || '');
        contenido += `${e.id},${e.destinatario},${e.direccion},${e.telefono},`;
        contenido += `${estadoText[e.estado]},${e.mensajero || 'Sin asignar'},${fechaCreacion},${fechaEntrega}\n`;
    }
    let blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `envios_${new Date().toLocaleDateString()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    mostrarNotificacion(`Exportados ${envios.length} envíos`, 'success', 'Exportación completa');
}

// Modo Oscuro
function initDarkMode() {
    const darkMode = localStorage.getItem('enviaTrack_darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        const btn = document.getElementById('btn-dark-mode');
        if (btn) btn.innerHTML = '☀️ Modo Claro';
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('enviaTrack_darkMode', isDark);
    const btn = document.getElementById('btn-dark-mode');
    if (btn) btn.innerHTML = isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
}

// Inicializar
async function init() {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Configurar eventos
    document.getElementById('btn-login')?.addEventListener('click', iniciarSesion);
    document.getElementById('btn-logout')?.addEventListener('click', cerrarSesion);
    document.getElementById('form-nuevo-envio')?.addEventListener('submit', (e) => { e.preventDefault(); agregarEnvio(); });
    document.getElementById('buscador')?.addEventListener('input', filtrarEnvios);
    document.getElementById('btn-exportar')?.addEventListener('click', exportarCSV);
    document.getElementById('btn-dark-mode')?.addEventListener('click', toggleDarkMode);
    
    // Permitir login con Enter
    document.getElementById('login-password')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') iniciarSesion();
    });
    document.getElementById('login-email')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') iniciarSesion();
    });
    
    initDarkMode();
    await verificarSesion();
}

init();