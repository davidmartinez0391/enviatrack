let listaEnvios = [];
let siguienteId = 1;

// ─── Utilidades ───────────────────────────────────────────────────────────────

function limpiarTexto(texto) {
    return texto.toLowerCase()
        .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
        .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n').replace(/ü/g, 'u');
}

function mostrarMensaje(mensaje, tipo = 'success', titulo = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const iconos  = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
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

// ─── Persistencia ─────────────────────────────────────────────────────────────

function cargarDatos() {
    const datos     = localStorage.getItem('enviaTrack_envios');
    const idGuardado = localStorage.getItem('enviaTrack_proximoId');

    if (datos) {
        listaEnvios = JSON.parse(datos);
        console.log('✅ Cargados ' + listaEnvios.length + ' envíos');
    } else {
        listaEnvios = [
            { id: 1, destinatario: "María González",    direccion: "Calle 45 # 20-30, Bogotá",       telefono: "3001234567", estado: "pendiente",  mensajero: "Luis Torres",     fechaCreacion: "2025-03-22 10:30" },
            { id: 2, destinatario: "Carlos Rodríguez",  direccion: "Carrera 15 # 88-12, Medellín",   telefono: "3109876543", estado: "entregado",  mensajero: "Pedro Martínez",  fechaCreacion: "2025-03-22 09:15", fechaEntrega: "2026-03-27 20:43" },
            { id: 3, destinatario: "Ana Lucía Fernández", direccion: "Avenida 19 # 123-45, Cali",   telefono: "3155558888", estado: "entregado",  mensajero: "Luis Torres",     fechaCreacion: "2025-03-21 16:20", fechaEntrega: "2025-03-21 17:45" },
            { id: 4, destinatario: "David Martínez",    direccion: "Cra 53 # 79-20",                 telefono: "3027414016", estado: "pendiente",  mensajero: null,              fechaCreacion: new Date().toLocaleString() }
        ];
        siguienteId = 5;
        guardarDatos();
    }

    if (idGuardado) {
        siguienteId = parseInt(idGuardado);
    } else if (listaEnvios.length > 0) {
        siguienteId = Math.max(...listaEnvios.map(e => e.id)) + 1;
    }
}

function guardarDatos() {
    localStorage.setItem('enviaTrack_envios', JSON.stringify(listaEnvios));
    localStorage.setItem('enviaTrack_proximoId', siguienteId);
}

// ─── Tabla ────────────────────────────────────────────────────────────────────

function mostrarTabla() {
    const contenedor = document.getElementById('tabla-envios');
    if (!contenedor) return;

    const texto     = limpiarTexto(document.getElementById('buscador')?.value || '');
    const filtrados = texto === ''
        ? listaEnvios
        : listaEnvios.filter(e =>
            limpiarTexto(e.destinatario).includes(texto) ||
            limpiarTexto(e.direccion).includes(texto)
          );

    if (listaEnvios.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; padding:20px;">No hay envíos registrados</p>';
        actualizarContadores();
        actualizarGraficos();
        return;
    }

    if (filtrados.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; padding:20px;">No hay envíos que coincidan con la búsqueda</p>';
        actualizarContadores();
        actualizarGraficos();
        return;
    }

    const estadoText  = { pendiente: '⏳ Pendiente', en_ruta: '🚚 En ruta', entregado: '✅ Entregado' };
    const estadoClass = { pendiente: 'estado-pendiente', en_ruta: 'estado-en-ruta', entregado: 'estado-entregado' };

    let filas = '';
    for (const e of filtrados) {
        const btnEditar = `<button onclick="editarEnvio(${e.id})" style="background:#f39c12; color:white; padding:5px 10px; margin-right:5px; border:none; border-radius:3px; cursor:pointer;">✏️ Editar</button>`;
        const btnEliminar = `<button onclick="eliminarEnvio(${e.id})" style="background:#e74c3c; color:white; padding:5px 10px; border:none; border-radius:3px; cursor:pointer;">🗑️ Eliminar</button>`;

        let botones = '';
        if (e.estado === 'pendiente') {
            botones = btnEditar
                + `<button onclick="iniciarRuta(${e.id})" style="background:#3498db; color:white; padding:5px 10px; margin-right:5px; border:none; border-radius:3px; cursor:pointer;">🚚 Iniciar Ruta</button>`
                + btnEliminar;
        } else if (e.estado === 'en_ruta') {
            botones = btnEditar
                + `<button onclick="marcarEntregado(${e.id})" style="background:#27ae60; color:white; padding:5px 10px; margin-right:5px; border:none; border-radius:3px; cursor:pointer;">✅ Marcar Entregado</button>`
                + btnEliminar;
        } else {
            botones = `<span style="color:#27ae60; margin-right:10px;">✓ Completado</span>`
                + btnEditar
                + `<button onclick="eliminarEnvio(${e.id})" style="background:#e74c3c; color:white; padding:5px 10px; margin-left:5px; border:none; border-radius:3px; cursor:pointer;">🗑️ Eliminar</button>`;
        }

        filas += `
            <tr style="border-bottom:1px solid #ddd;">
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

    contenedor.innerHTML = `
        <table style="width:100%; border-collapse:collapse;">
            <thead style="background:#333; color:white;">
                <tr>
                    <th style="padding:10px;">ID</th>
                    <th style="padding:10px;">Destinatario</th>
                    <th style="padding:10px;">Dirección</th>
                    <th style="padding:10px;">Teléfono</th>
                    <th style="padding:10px;">Estado</th>
                    <th style="padding:10px;">Mensajero</th>
                    <th style="padding:10px;">Fecha Creación</th>
                    <th style="padding:10px;">Fecha Entrega</th>
                    <th style="padding:10px;">Acciones</th>
                </tr>
            </thead>
            <tbody>${filas}</tbody>
        </table>`;

    actualizarContadores();
    actualizarGraficos();
}

function actualizarContadores() {
    const pend  = listaEnvios.filter(e => e.estado === 'pendiente').length;
    const ruta  = listaEnvios.filter(e => e.estado === 'en_ruta').length;
    const entre = listaEnvios.filter(e => e.estado === 'entregado').length;

    document.getElementById('contador-pendiente').textContent = pend;
    document.getElementById('contador-en-ruta').textContent   = ruta;
    document.getElementById('contador-entregado').textContent = entre;
    document.getElementById('contador-total').textContent     = listaEnvios.length;
}

// ─── Gráficos ─────────────────────────────────────────────────────────────────

let graficoEstados  = null;
let graficoEntregas = null;

function actualizarGraficos() {
    if (typeof Chart === 'undefined') return;

    const pendientes = listaEnvios.filter(e => e.estado === 'pendiente').length;
    const enRuta     = listaEnvios.filter(e => e.estado === 'en_ruta').length;
    const entregados = listaEnvios.filter(e => e.estado === 'entregado').length;

    const ctxEstados = document.getElementById('graficoEstados');
    if (ctxEstados) {
        if (graficoEstados) graficoEstados.destroy();
        graficoEstados = new Chart(ctxEstados, {
            type: 'doughnut',
            data: {
                labels: ['Pendientes', 'En Ruta', 'Entregados'],
                datasets: [{
                    data: [pendientes, enRuta, entregados],
                    backgroundColor: ['#f39c12', '#3498db', '#27ae60'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    const ultimos7Dias  = [];
    const entregasPorDia = [];

    for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = fecha.toLocaleDateString();
        ultimos7Dias.push(fechaStr);

        const count = listaEnvios.filter(e => {
            if (!e.fechaEntrega) return false;
            return new Date(e.fechaEntrega).toLocaleDateString() === fechaStr;
        }).length;
        entregasPorDia.push(count);
    }

    const ctxEntregas = document.getElementById('graficoEntregas');
    if (ctxEntregas) {
        if (graficoEntregas) graficoEntregas.destroy();
        graficoEntregas = new Chart(ctxEntregas, {
            type: 'line',
            data: {
                labels: ultimos7Dias,
                datasets: [{
                    label: 'Entregas realizadas',
                    data: entregasPorDia,
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        });
    }
}

// ─── Acciones sobre envíos ────────────────────────────────────────────────────

function iniciarRuta(id) {
    const e = listaEnvios.find(x => x.id === id);
    if (e) {
        e.estado = 'en_ruta';
        if (!e.mensajero) e.mensajero = 'Mensajero Asignado';
        guardarDatos();
        mostrarTabla();
        mostrarMensaje(`Envío #${id} está en RUTA`, 'info', 'Ruta iniciada');
    }
}

function marcarEntregado(id) {
    const e = listaEnvios.find(x => x.id === id);
    if (e) {
        e.estado = 'entregado';
        e.fechaEntrega = new Date().toLocaleString();
        guardarDatos();
        mostrarTabla();
        mostrarMensaje(`Envío #${id} entregado`, 'success', 'Entrega completada');
    }
}

function eliminarEnvio(id) {
    const e = listaEnvios.find(x => x.id === id);
    if (e && confirm(`¿Eliminar envío #${id} de ${e.destinatario}?`)) {
        listaEnvios.splice(listaEnvios.findIndex(x => x.id === id), 1);
        guardarDatos();
        mostrarTabla();
        mostrarMensaje(`Envío #${id} eliminado`, 'warning', 'Eliminado');
    }
}

function editarEnvio(id) {
    const envio = listaEnvios.find(e => e.id === id);
    if (!envio) { mostrarMensaje('Envío no encontrado', 'error', 'Error'); return; }

    const nuevoDestinatario = prompt('Editar destinatario:', envio.destinatario);
    if (nuevoDestinatario === null) return;

    const nuevaDireccion = prompt('Editar dirección:', envio.direccion);
    if (nuevaDireccion === null) return;

    const nuevoTelefono = prompt('Editar teléfono:', envio.telefono);
    if (nuevoTelefono === null) return;

    envio.destinatario = nuevoDestinatario.trim() || envio.destinatario;
    envio.direccion    = nuevaDireccion.trim()    || envio.direccion;
    envio.telefono     = nuevoTelefono.trim()     || envio.telefono;

    guardarDatos();
    mostrarTabla();
    mostrarMensaje(`Envío #${id} actualizado`, 'success', 'Editado');
}

function agregarEnvio() {
    const dest = document.getElementById('destinatario').value.trim();
    const dir  = document.getElementById('direccion').value.trim();
    const tel  = document.getElementById('telefono').value.trim();

    if (!dest || !dir || !tel) {
        mostrarMensaje('Completa todos los campos', 'warning', 'Campos incompletos');
        return false;
    }

    const nuevo = {
        id: siguienteId,
        destinatario: dest,
        direccion: dir,
        telefono: tel,
        estado: 'pendiente',
        mensajero: null,
        fechaCreacion: new Date().toLocaleString()
    };

    listaEnvios.push(nuevo);
    siguienteId++;
    guardarDatos();
    mostrarTabla();

    document.getElementById('destinatario').value = '';
    document.getElementById('direccion').value    = '';
    document.getElementById('telefono').value     = '';

    mostrarMensaje(`Envío #${nuevo.id} registrado`, 'success', 'Envío creado');
    return false;
}

// ─── Exportar CSV ─────────────────────────────────────────────────────────────

function exportarCSV() {
    const estadoText = { pendiente: 'Pendiente', en_ruta: 'En Ruta', entregado: 'Entregado' };
    let contenido = 'ID,Destinatario,Dirección,Teléfono,Estado,Mensajero,Fecha Creación,Fecha Entrega\n';

    for (const e of listaEnvios) {
        contenido += `${e.id},"${e.destinatario}","${e.direccion}","${e.telefono}",`;
        contenido += `${estadoText[e.estado]},"${e.mensajero || 'Sin asignar'}","${e.fechaCreacion}","${e.fechaEntrega || ''}"\n`;
    }

    const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `envios_${new Date().toLocaleDateString()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    mostrarMensaje(`Exportados ${listaEnvios.length} envíos`, 'success', 'Exportación completa');
}

// ─── Modo oscuro ──────────────────────────────────────────────────────────────

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

// ─── Login / Logout ───────────────────────────────────────────────────────────

function verificarSesion() {
    // Siempre mostrar login al cargar la página
    document.getElementById('login-panel').style.display = 'block';
    document.getElementById('main-panel').style.display = 'none';
    
    // Limpiar cualquier sesión guardada
    localStorage.removeItem('enviaTrack_sesion');
    localStorage.removeItem('enviaTrack_usuario');
}

// Usuarios autorizados (puedes agregar más)
const USUARIOS_AUTORIZADOS = [
    { email: "admin@enviatrack.com", password: "Admin123" },
    { email: "comercio@enviatrack.com", password: "Comercio2024" }
];

function iniciarSesion() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        mostrarMensaje('Ingresa tu correo y contraseña', 'warning', 'Campos vacíos');
        return;
    }

    const usuarioValido = USUARIOS_AUTORIZADOS.find(u => u.email === email && u.password === password);

    if (usuarioValido) {
        localStorage.setItem('enviaTrack_sesion', 'activa');
        localStorage.setItem('enviaTrack_usuario', email);
        document.getElementById('login-panel').style.display = 'none';
        document.getElementById('main-panel').style.display = 'block';
        mostrarMensaje(`Bienvenido, ${email}`, 'success', 'Sesión iniciada');
        
        // Solo cargar datos si es admin.js o app.js según corresponda
        if (typeof cargarDatos === 'function') cargarDatos();
        if (typeof mostrarTabla === 'function') mostrarTabla();
        if (typeof mostrarMensajeros === 'function') {
            mostrarMensajeros();
            actualizarSelects();
            actualizarGraficoMensajeros();
        }
    } else {
        mostrarMensaje('Credenciales incorrectas', 'error', 'Error de acceso');
    }
}

function cerrarSesion() {
    localStorage.removeItem('enviaTrack_sesion');
    document.getElementById('main-panel').style.display  = 'none';
    document.getElementById('login-panel').style.display = 'block';
    mostrarMensaje('Sesión cerrada', 'info', 'Hasta luego');
}

// ─── Inicialización ───────────────────────────────────────────────────────────

cargarDatos();
initDarkMode();
verificarSesion();

// Si ya hay sesión activa mostramos la tabla de una
if (localStorage.getItem('enviaTrack_sesion') === 'activa') {
    mostrarTabla();
}

document.getElementById('btn-login')?.addEventListener('click', iniciarSesion);
document.getElementById('btn-logout')?.addEventListener('click', cerrarSesion);
document.getElementById('form-nuevo-envio')?.addEventListener('submit', (e) => { e.preventDefault(); agregarEnvio(); });
document.getElementById('buscador')?.addEventListener('input', () => mostrarTabla());
document.getElementById('btn-exportar')?.addEventListener('click', exportarCSV);
document.getElementById('btn-dark-mode')?.addEventListener('click', toggleDarkMode);
