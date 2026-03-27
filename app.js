// Base de datos local
let envios = [];
let proximoId = 1;

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

function cargarDatos() {
    let datos = localStorage.getItem('enviaTrack_envios');
    let idGuardado = localStorage.getItem('enviaTrack_proximoId');
    
    if (datos) {
        envios = JSON.parse(datos);
        console.log('✅ Cargados ' + envios.length + ' envíos');
    } else {
        envios = [
            { id: 1, destinatario: "María González", direccion: "Calle 45 # 20-30, Bogotá", telefono: "3001234567", estado: "pendiente", mensajero: "Luis Torres", fechaCreacion: "2025-03-22 10:30" },
            { id: 2, destinatario: "Carlos Rodríguez", direccion: "Carrera 15 # 88-12, Medellín", telefono: "3109876543", estado: "entregado", mensajero: null, fechaCreacion: "2025-03-22 09:15", fechaEntrega: "2026-02-23 20:43:50" },
            { id: 3, destinatario: "Ana Lucía Fernández", direccion: "Avenida 19 # 123-45, Cali", telefono: "3155558888", estado: "entregado", mensajero: "Luis Torres", fechaCreacion: "2025-03-21 16:20", fechaEntrega: "2025-03-21 17:45" }
        ];
        proximoId = 4;
        guardarDatos();
    }
    
    if (idGuardado) {
        proximoId = parseInt(idGuardado);
    } else if (envios.length > 0) {
        let ids = envios.map(e => e.id);
        proximoId = Math.max(...ids, 0) + 1;
    }
}

function guardarDatos() {
    localStorage.setItem('enviaTrack_envios', JSON.stringify(envios));
    localStorage.setItem('enviaTrack_proximoId', proximoId);
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
    
    let html = `<table style="width:100%; border-collapse:collapse;"><thead style="background:#333; color:white;"><html>
        <th style="padding:10px;">ID</th><th style="padding:10px;">Destinatario</th><th style="padding:10px;">Dirección</th>
        <th style="padding:10px;">Teléfono</th><th style="padding:10px;">Estado</th><th style="padding:10px;">Mensajero</th>
        <th style="padding:10px;">Fecha Creación</th><th style="padding:10px;">Fecha Entrega</th><th style="padding:10px;">Acciones</th>
    </tr></thead><tbody>`;
    
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
        
        html += `<tr style="border-bottom:1px solid #ddd;">
            <td style="padding:8px; text-align:center;">${e.id}</td>
            <td style="padding:8px;">${e.destinatario}</td>
            <td style="padding:8px;">${e.direccion}</td>
            <td style="padding:8px;">${e.telefono}</td>
            <td style="padding:8px;" class="${estadoClass[e.estado]}">${estadoText[e.estado]}</td>
            <td style="padding:8px;">${e.mensajero || 'Sin asignar'}</td>
            <td style="padding:8px;">${e.fechaCreacion}</td>
            <td style="padding:8px;">${e.fechaEntrega || '—'}</td>
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
    
    document.getElementById('contador-pendiente').textContent = pend;
    document.getElementById('contador-en-ruta').textContent = ruta;
    document.getElementById('contador-entregado').textContent = entre;
    document.getElementById('contador-total').textContent = envios.length;
    
    actualizarGraficos();
}

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
            if (!e.fechaEntrega) return false;
            const fechaEntrega = new Date(e.fechaEntrega);
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

function iniciarRuta(id) {
    let e = envios.find(x => x.id === id);
    if (e) {
        e.estado = 'en_ruta';
        if (!e.mensajero) e.mensajero = 'Mensajero Asignado';
        guardarDatos();
        mostrarTabla();
        mostrarNotificacion(`Envío #${id} está en RUTA`, 'info', 'Ruta iniciada');
    }
}

function marcarEntregado(id) {
    let e = envios.find(x => x.id === id);
    if (e) {
        e.estado = 'entregado';
        e.fechaEntrega = new Date().toLocaleString();
        guardarDatos();
        mostrarTabla();
        mostrarNotificacion(`Envío #${id} entregado a ${e.destinatario}`, 'success', 'Entrega completada');
    }
}

function eliminarEnvio(id) {
    let e = envios.find(x => x.id === id);
    if (e && confirm(`¿Eliminar envío #${id} de ${e.destinatario}?`)) {
        let idx = envios.findIndex(x => x.id === id);
        envios.splice(idx, 1);
        guardarDatos();
        mostrarTabla();
        mostrarNotificacion(`Envío #${id} eliminado`, 'warning', 'Eliminado');
    }
}

function editarEnvio(id) {
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
    
    guardarDatos();
    mostrarTabla();
    mostrarNotificacion(`Envío #${id} actualizado`, 'success', 'Editado');
}

function agregarEnvio() {
    let dest = document.getElementById('destinatario').value;
    let dir = document.getElementById('direccion').value;
    let tel = document.getElementById('telefono').value;
    
    if (!dest || !dir || !tel) {
        mostrarNotificacion('Completa todos los campos', 'warning', 'Campos incompletos');
        return false;
    }
    
    let nuevo = {
        id: proximoId,
        destinatario: dest,
        direccion: dir,
        telefono: tel,
        estado: 'pendiente',
        mensajero: null,
        fechaCreacion: new Date().toLocaleString()
    };
    
    envios.push(nuevo);
    proximoId++;
    guardarDatos();
    mostrarTabla();
    
    document.getElementById('destinatario').value = '';
    document.getElementById('direccion').value = '';
    document.getElementById('telefono').value = '';
    
    mostrarNotificacion(`Envío #${nuevo.id} registrado`, 'success', 'Envío creado');
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
        contenido += `${estadoText[e.estado]},${e.mensajero || 'Sin asignar'},${e.fechaCreacion},${e.fechaEntrega || ''}\n`;
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
    if (btn) {
        btn.innerHTML = isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
    }
}

cargarDatos();
mostrarTabla();

document.getElementById('form-nuevo-envio')?.addEventListener('submit', (e) => { e.preventDefault(); agregarEnvio(); });
document.getElementById('buscador')?.addEventListener('input', filtrarEnvios);
document.getElementById('btn-exportar')?.addEventListener('click', exportarCSV);

// Evento modo oscuro
const btnDarkMode = document.getElementById('btn-dark-mode');
if (btnDarkMode) {
    btnDarkMode.addEventListener('click', toggleDarkMode);
}
initDarkMode();