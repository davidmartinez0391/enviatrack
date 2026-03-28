// Usuarios autorizados
const USUARIOS_AUTORIZADOS = [
    { email: "admin@enviatrack.com", password: "Admin123" },
    { email: "comercio@enviatrack.com", password: "Comercio2024" }
];

// Variables globales
let envios = [];
let mensajeros = [];
let proximoId = 1;

// Gráficos
let graficoEstados = null;
let graficoEntregas = null;
let graficoMensajeros = null;

// ─── Utilidades ───────────────────────────────────────────────────────────────
function limpiarTexto(texto) {
    return texto.toLowerCase()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
        .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n').replace(/ü/g, 'u');
}

function sanitizar(texto) {
    if (!texto) return '';
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function mostrarMensaje(mensaje, tipo = 'success', titulo = '') {
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

// ─── Pestañas ─────────────────────────────────────────────────────────────────
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            document.getElementById(`tab-${tabId}`).classList.add('active');
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// ─── Persistencia ─────────────────────────────────────────────────────────────
function cargarDatos() {
    const enviosGuardados = localStorage.getItem('enviaTrack_envios');
    if (enviosGuardados) {
        envios = JSON.parse(enviosGuardados);
        const ids = envios.map(e => e.id);
        proximoId = Math.max(...ids, 0) + 1;
    } else {
        envios = [
            { id: 1, destinatario: "María González", direccion: "Calle 45 # 20-30, Bogotá", telefono: "3001234567", estado: "pendiente", mensajero: null, fechaCreacion: "2025-03-22 10:30" },
            { id: 2, destinatario: "Carlos Rodríguez", direccion: "Carrera 15 # 88-12, Medellín", telefono: "3109876543", estado: "entregado", mensajero: "Pedro Martínez", fechaCreacion: "2025-03-22 09:15", fechaEntrega: "2026-03-27 20:43" },
            { id: 3, destinatario: "Ana Lucía Fernández", direccion: "Avenida 19 # 123-45, Cali", telefono: "3155558888", estado: "entregado", mensajero: "Luis Torres", fechaCreacion: "2025-03-21 16:20", fechaEntrega: "2025-03-21 17:45" }
        ];
        proximoId = 4;
        guardarEnvios();
    }

    const mensajerosGuardados = localStorage.getItem('enviaTrack_mensajeros');
    if (mensajerosGuardados) {
        mensajeros = JSON.parse(mensajerosGuardados);
    } else {
        mensajeros = [
            { codigo: "MEN001", nombre: "Pedro Martínez", telefono: "3109876543" },
            { codigo: "MEN002", nombre: "Luis Torres", telefono: "3155558888" },
            { codigo: "MEN003", nombre: "Ana Ramírez", telefono: "3001112233" }
        ];
        guardarMensajeros();
    }
}

function guardarEnvios() {
    localStorage.setItem('enviaTrack_envios', JSON.stringify(envios));
}

function guardarMensajeros() {
    localStorage.setItem('enviaTrack_mensajeros', JSON.stringify(mensajeros));
}

// ─── Actualizar contadores y gráficos ─────────────────────────────────────────
function actualizarContadores() {
    const pend = envios.filter(e => e.estado === 'pendiente').length;
    const ruta = envios.filter(e => e.estado === 'en_ruta').length;
    const entre = envios.filter(e => e.estado === 'entregado').length;
    
    document.getElementById('contador-pendiente').textContent = pend;
    document.getElementById('contador-en-ruta').textContent = ruta;
    document.getElementById('contador-entregado').textContent = entre;
    document.getElementById('contador-total').textContent = envios.length;
    document.getElementById('contador-mensajeros').textContent = mensajeros.length;
}

function actualizarGraficos() {
    if (typeof Chart === 'undefined') return;
    
    // Gráfico de estados
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
    
    // Gráfico de entregas por día
    const ultimos7Dias = [];
    const entregasPorDia = [];
    for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toLocaleDateString();
        ultimos7Dias.push(fechaStr);
        const entregasDia = envios.filter(e => {
            if (!e.fechaEntrega) return false;
            return new Date(e.fechaEntrega).toLocaleDateString() === fechaStr;
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
    
    // Gráfico de mensajeros
    const datosMensajeros = mensajeros.map(m => {
        const totalEntregas = envios.filter(e => e.mensajero === m.nombre && e.estado === 'entregado').length;
        const totalAsignados = envios.filter(e => e.mensajero === m.nombre).length;
        return { nombre: m.nombre.split(' ')[0], completado: totalEntregas, pendiente: totalAsignados - totalEntregas, total: totalAsignados };
    }).filter(d => d.total > 0);
    
    const ctxMensajeros = document.getElementById('graficoMensajeros');
    if (ctxMensajeros) {
        if (graficoMensajeros) graficoMensajeros.destroy();
        if (datosMensajeros.length > 0) {
            graficoMensajeros = new Chart(ctxMensajeros, {
                type: 'bar',
                data: {
                    labels: datosMensajeros.map(d => d.nombre),
                    datasets: [
                        { label: '✅ Entregados', data: datosMensajeros.map(d => d.completado), backgroundColor: '#27ae60', borderRadius: 5 },
                        { label: '⏳ Pendientes', data: datosMensajeros.map(d => d.pendiente), backgroundColor: '#f39c12', borderRadius: 5 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
            });
        } else {
            ctxMensajeros.parentElement.innerHTML = '<p style="text-align:center; padding:40px;">No hay datos de entregas para mostrar</p><canvas id="graficoMensajeros" style="display:none;"></canvas>';
        }
    }
}

// ─── Tabla de envíos ──────────────────────────────────────────────────────────
function mostrarEnvios() {
    const contenedor = document.getElementById('tabla-envios');
    if (!contenedor) return;
    
    const texto = limpiarTexto(document.getElementById('buscador')?.value || '');
    let filtrados = envios;
    if (texto) {
        filtrados = envios.filter(e => limpiarTexto(e.destinatario).includes(texto) || limpiarTexto(e.direccion).includes(texto));
    }
    
    if (filtrados.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; padding:20px;">No hay envíos</p>';
        return;
    }
    
    const estadoText = { pendiente: '⏳ Pendiente', en_ruta: '🚚 En ruta', entregado: '✅ Entregado' };
    const estadoClass = { pendiente: 'estado-pendiente', en_ruta: 'estado-en-ruta', entregado: 'estado-entregado' };
    
    let html = `<table style="width:100%; border-collapse:collapse;"><thead style="background:#333; color:white;"><tr>
        <th style="padding:10px;">ID</th><th>Destinatario</th><th>Dirección</th><th>Teléfono</th>
        <th>Estado</th><th>Mensajero</th><th>Fecha Creación</th><th>Fecha Entrega</th><th>Acciones</th>
    </tr></thead><tbody>`;
    
    for (let e of filtrados) {
        const btnEditar = `<button onclick="editarEnvio(${e.id})" style="background:#f39c12; color:white; padding:5px 10px; margin-right:5px; border:none; border-radius:3px;">✏️ Editar</button>`;
        const btnEliminar = `<button onclick="eliminarEnvio(${e.id})" style="background:#e74c3c; color:white; padding:5px 10px; border:none; border-radius:3px;">🗑️ Eliminar</button>`;
        
        let botones = '';
        if (e.estado === 'pendiente') {
            botones = btnEditar + `<button onclick="iniciarRuta(${e.id})" style="background:#3498db; color:white; padding:5px 10px; margin-right:5px;">🚚 Iniciar Ruta</button>` + btnEliminar;
        } else if (e.estado === 'en_ruta') {
            botones = btnEditar + `<button onclick="marcarEntregado(${e.id})" style="background:#27ae60; color:white; padding:5px 10px; margin-right:5px;">✅ Marcar Entregado</button>` + btnEliminar;
        } else {
            botones = `<span style="color:#27ae60;">✓ Completado</span> ` + btnEditar + btnEliminar;
        }
        
        html += `<tr><td style="padding:8px;text-align:center;">${e.id}</td>
            <td>${e.destinatario}</td><td>${e.direccion}</td><td>${e.telefono}</td>
            <td class="${estadoClass[e.estado]}">${estadoText[e.estado]}</td>
            <td>${e.mensajero || 'Sin asignar'}</td>
            <td>${e.fechaCreacion}</td><td>${e.fechaEntrega || '—'}</td>
            <td style="text-align:center;">${botones}</td></tr>`;
    }
    html += `</tbody></table>`;
    contenedor.innerHTML = html;
}

// ─── Acciones de envíos ───────────────────────────────────────────────────────
function iniciarRuta(id) {
    const e = envios.find(x => x.id === id);
    if (e) {
        e.estado = 'en_ruta';
        if (!e.mensajero) e.mensajero = 'Mensajero Asignado';
        guardarEnvios();
        actualizarTodo();
        mostrarMensaje(`Envío #${id} en RUTA`, 'info');
    }
}

function marcarEntregado(id) {
    const e = envios.find(x => x.id === id);
    if (e) {
        e.estado = 'entregado';
        e.fechaEntrega = new Date().toLocaleString();
        guardarEnvios();
        actualizarTodo();
        mostrarMensaje(`Envío #${id} ENTREGADO`, 'success');
    }
}

function eliminarEnvio(id) {
    const e = envios.find(x => x.id === id);
    if (e && confirm(`¿Eliminar envío #${id}?`)) {
        envios = envios.filter(x => x.id !== id);
        guardarEnvios();
        actualizarTodo();
        mostrarMensaje(`Envío #${id} eliminado`, 'warning');
    }
}

function editarEnvio(id) {
    const e = envios.find(x => x.id === id);
    if (!e) return;
    const nuevoDest = prompt('Destinatario:', e.destinatario);
    if (nuevoDest) e.destinatario = nuevoDest;
    const nuevaDir = prompt('Dirección:', e.direccion);
    if (nuevaDir) e.direccion = nuevaDir;
    const nuevoTel = prompt('Teléfono:', e.telefono);
    if (nuevoTel) e.telefono = nuevoTel;
    guardarEnvios();
    actualizarTodo();
    mostrarMensaje(`Envío #${id} actualizado`, 'success');
}

function agregarEnvio() {
    const dest = sanitizar(document.getElementById('destinatario').value.trim());
    const dir = sanitizar(document.getElementById('direccion').value.trim());
    const tel = sanitizar(document.getElementById('telefono').value.trim());
    if (!dest || !dir || !tel) {
        mostrarMensaje('Completa todos los campos', 'warning');
        return;
    }
    envios.push({
        id: proximoId++, destinatario: dest, direccion: dir, telefono: tel,
        estado: 'pendiente', mensajero: null, fechaCreacion: new Date().toLocaleString()
    });
    guardarEnvios();
    document.getElementById('destinatario').value = '';
    document.getElementById('direccion').value = '';
    document.getElementById('telefono').value = '';
    actualizarTodo();
    mostrarMensaje(`Envío #${proximoId-1} registrado`, 'success');
}

// ─── Tabla de mensajeros ──────────────────────────────────────────────────────
function mostrarMensajeros() {
    const contenedor = document.getElementById('tabla-mensajeros');
    if (!contenedor) return;
    if (mensajeros.length === 0) {
        contenedor.innerHTML = '<p>No hay mensajeros</p>';
        return;
    }
    let html = `<table style="width:100%;"><thead style="background:#333; color:white;"><tr>
        <th>Código</th><th>Nombre</th><th>Teléfono</th><th>Envíos</th><th>Acciones</th>
    </tr></thead><tbody>`;
    for (let m of mensajeros) {
        const asignados = envios.filter(e => e.mensajero === m.nombre).length;
        html += `<tr><td>${m.codigo}</td><td>${m.nombre}</td><td>${m.telefono}</td>
            <td style="text-align:center;">${asignados}</td>
            <td><button onclick="editarMensajero('${m.codigo}')" class="btn-editar">✏️ Editar</button>
            <button onclick="eliminarMensajero('${m.codigo}')" class="btn-eliminar">🗑️ Eliminar</button></td></tr>`;
    }
    html += `</tbody></table>`;
    contenedor.innerHTML = html;
}

function agregarMensajero() {
    const codigo = sanitizar(document.getElementById('codigo-mensajero').value.trim().toUpperCase());
    const nombre = sanitizar(document.getElementById('nombre-mensajero').value.trim());
    const telefono = sanitizar(document.getElementById('telefono-mensajero').value.trim());
    if (!codigo || !nombre || !telefono) {
        mostrarMensaje('Completa todos los campos', 'warning');
        return;
    }
    if (mensajeros.some(m => m.codigo === codigo)) {
        mostrarMensaje('Código ya existe', 'error');
        return;
    }
    mensajeros.push({ codigo, nombre, telefono });
    guardarMensajeros();
    document.getElementById('codigo-mensajero').value = '';
    document.getElementById('nombre-mensajero').value = '';
    document.getElementById('telefono-mensajero').value = '';
    actualizarTodo();
    mostrarMensaje(`Mensajero ${nombre} agregado`, 'success');
}

function editarMensajero(codigo) {
    const m = mensajeros.find(x => x.codigo === codigo);
    if (!m) return;
    const nuevoNombre = prompt('Nuevo nombre:', m.nombre);
    if (nuevoNombre) {
        envios.forEach(e => { if (e.mensajero === m.nombre) e.mensajero = nuevoNombre; });
        m.nombre = nuevoNombre;
    }
    const nuevoTel = prompt('Nuevo teléfono:', m.telefono);
    if (nuevoTel) m.telefono = nuevoTel;
    guardarMensajeros();
    guardarEnvios();
    actualizarTodo();
    mostrarMensaje('Mensajero actualizado', 'success');
}

function eliminarMensajero(codigo) {
    const m = mensajeros.find(x => x.codigo === codigo);
    if (!m) return;
    if (confirm(`¿Eliminar a ${m.nombre}?`)) {
        envios.forEach(e => { if (e.mensajero === m.nombre) e.mensajero = null; });
        mensajeros = mensajeros.filter(x => x.codigo !== codigo);
        guardarMensajeros();
        guardarEnvios();
        actualizarTodo();
        mostrarMensaje('Mensajero eliminado', 'warning');
    }
}

// ─── Asignación ───────────────────────────────────────────────────────────────
function actualizarSelects() {
    const selectEnvio = document.getElementById('select-envio');
    const selectMensajero = document.getElementById('select-mensajero');
    if (selectEnvio) {
        selectEnvio.innerHTML = '<option value="">Seleccionar envío...</option>';
        envios.filter(e => e.estado !== 'entregado').forEach(e => {
            selectEnvio.innerHTML += `<option value="${e.id}">#${e.id} - ${e.destinatario} ${e.mensajero ? '(Asignado)' : '(Sin asignar)'}</option>`;
        });
    }
    if (selectMensajero) {
        selectMensajero.innerHTML = '<option value="">Seleccionar mensajero...</option>';
        mensajeros.forEach(m => {
            selectMensajero.innerHTML += `<option value="${m.nombre}">${m.codigo} - ${m.nombre}</option>`;
        });
    }
}

function asignarMensajero() {
    const envioId = document.getElementById('select-envio').value;
    const mensajeroNombre = document.getElementById('select-mensajero').value;
    if (!envioId || !mensajeroNombre) {
        mostrarMensaje('Selecciona un envío y un mensajero', 'warning');
        return;
    }
    const envio = envios.find(e => e.id === parseInt(envioId));
    if (envio) {
        envio.mensajero = mensajeroNombre;
        guardarEnvios();
        actualizarTodo();
        mostrarMensaje(`Envío #${envioId} asignado a ${mensajeroNombre}`, 'success');
    }
}

// ─── Exportar CSV ────────────────────────────────────────────────────────────
function exportarCSV() {
    const estadoText = { pendiente: 'Pendiente', en_ruta: 'En Ruta', entregado: 'Entregado' };
    let contenido = 'ID,Destinatario,Dirección,Teléfono,Estado,Mensajero,Fecha Creación,Fecha Entrega\n';
    for (let e of envios) {
        contenido += `${e.id},"${e.destinatario}","${e.direccion}","${e.telefono}",`;
        contenido += `${estadoText[e.estado]},"${e.mensajero || 'Sin asignar'}","${e.fechaCreacion}","${e.fechaEntrega || ''}"\n`;
    }
    const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `envios_${new Date().toLocaleDateString()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    mostrarMensaje(`Exportados ${envios.length} envíos`, 'success');
}

// ─── Actualizar todo ─────────────────────────────────────────────────────────
function actualizarTodo() {
    mostrarEnvios();
    mostrarMensajeros();
    actualizarSelects();
    actualizarContadores();
    actualizarGraficos();
}

// ─── Login / Logout ──────────────────────────────────────────────────────────
let intentosFallidos = 0;

function iniciarSesion() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        mostrarMensaje('Ingresa tu correo y contraseña', 'warning');
        return;
    }
    
    if (intentosFallidos >= 5) {
        mostrarMensaje('Demasiados intentos. Espera 5 minutos.', 'error');
        setTimeout(() => intentosFallidos = 0, 300000);
        return;
    }
    
    const valido = USUARIOS_AUTORIZADOS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (valido) {
        intentosFallidos = 0;
        localStorage.setItem('enviaTrack_sesion', 'activa');
        document.getElementById('login-panel').style.display = 'none';
        document.getElementById('main-panel').style.display = 'block';
        cargarDatos();
        actualizarTodo();
        mostrarMensaje(`Bienvenido, ${email}`, 'success');
    } else {
        intentosFallidos++;
        mostrarMensaje(`Credenciales incorrectas. Intentos restantes: ${5 - intentosFallidos}`, 'error');
    }
}

function cerrarSesion() {
    localStorage.removeItem('enviaTrack_sesion');
    document.getElementById('main-panel').style.display = 'none';
    document.getElementById('login-panel').style.display = 'block';
    mostrarMensaje('Sesión cerrada', 'info');
}

function verificarSesion() {
    if (localStorage.getItem('enviaTrack_sesion') === 'activa') {
        document.getElementById('login-panel').style.display = 'none';
        document.getElementById('main-panel').style.display = 'block';
        cargarDatos();
        actualizarTodo();
    }
}

// ─── Modo Oscuro ────────────────────────────────────────────────────────────
function initDarkMode() {
    if (localStorage.getItem('enviaTrack_darkMode') === 'true') {
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
// ─── Rastreo de mensajeros ───────────────────────────────────────────────────
function mostrarRastreo() {
    const mensajerosConUbicacion = envios.filter(e => e.ubicacion && e.estado === 'en_ruta');
    if (mensajerosConUbicacion.length === 0) {
        mostrarMensaje('No hay mensajeros en ruta con ubicación disponible', 'info');
        return;
    }
    
    let html = '<div style="background:white; padding:20px; border-radius:8px; margin-top:20px;"><h3>📍 Rastreo de Mensajeros</h3>';
    for (let e of mensajerosConUbicacion) {
        html += `
            <div style="border-bottom:1px solid #ddd; padding:10px;">
                <strong>📦 Envío #${e.id}</strong> - ${e.destinatario}<br>
                <strong>👤 Mensajero:</strong> ${e.mensajero}<br>
                <strong>📍 Última ubicación:</strong> ${e.ubicacion.lat}, ${e.ubicacion.lng}<br>
                <strong>🕐 Hora:</strong> ${new Date(e.ubicacion.timestamp).toLocaleString()}<br>
                <strong>📱 Dispositivo:</strong> ${e.ubicacion.dispositivo || 'Desconocido'}<br>
                <a href="https://www.google.com/maps?q=${e.ubicacion.lat},${e.ubicacion.lng}" target="_blank" style="color:#27ae60;">Ver en mapa →</a>
            </div>
        `;
    }
    html += '</div>';
    
    // Mostrar en un modal o en la página
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
        <div style="background:white; border-radius:16px; padding:20px; max-width:500px; max-height:80%; overflow:auto;">
            <h2>📍 Rastreo en Vivo</h2>
            ${html}
            <button id="btn-cerrar-rastreo" style="margin-top:20px; padding:10px 20px; background:#e74c3c; color:white; border:none; border-radius:8px;">Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('btn-cerrar-rastreo')?.addEventListener('click', () => modal.remove());
}

// Agregar botón de rastreo al dashboard
function agregarBotonRastreo() {
    const header = document.querySelector('#main-panel > div:first-child');
    if (header && !document.getElementById('btn-rastrear')) {
        const btnRastreo = document.createElement('button');
        btnRastreo.id = 'btn-rastrear';
        btnRastreo.textContent = '📍 Rastrear Mensajeros';
        btnRastreo.style.backgroundColor = '#3498db';
        btnRastreo.style.color = 'white';
        btnRastreo.style.padding = '8px 16px';
        btnRastreo.style.border = 'none';
        btnRastreo.style.borderRadius = '5px';
        btnRastreo.style.cursor = 'pointer';
        btnRastreo.addEventListener('click', mostrarRastreo);
        
        const div = header.querySelector('div');
        if (div) div.appendChild(btnRastreo);
    }
}

// Llamar a agregarBotonRastreo después de cargar datos
setTimeout(agregarBotonRastreo, 1000);

// ─── Eventos e Inicialización ───────────────────────────────────────────────
document.getElementById('btn-login')?.addEventListener('click', iniciarSesion);
document.getElementById('btn-logout')?.addEventListener('click', cerrarSesion);
document.getElementById('form-nuevo-envio')?.addEventListener('submit', (e) => { e.preventDefault(); agregarEnvio(); });
document.getElementById('buscador')?.addEventListener('input', mostrarEnvios);
document.getElementById('btn-exportar')?.addEventListener('click', exportarCSV);
document.getElementById('btn-dark-mode')?.addEventListener('click', toggleDarkMode);
document.getElementById('btn-agregar-mensajero')?.addEventListener('click', agregarMensajero);
document.getElementById('btn-asignar')?.addEventListener('click', asignarMensajero);

document.getElementById('login-password')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') iniciarSesion(); });

initTabs();
initDarkMode();
verificarSesion();