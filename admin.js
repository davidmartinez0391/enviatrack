// Variables globales
let mensajeros = [];
let envios = [];

// Usuarios autorizados (mismo que en app.js)
const USUARIOS_AUTORIZADOS = [
    { email: "admin@enviatrack.com", password: "Admin123" },
    { email: "comercio@enviatrack.com", password: "Comercio2024" }
];

// ─── Notificaciones ───────────────────────────────────────────────────────────
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

// ─── Login / Logout ───────────────────────────────────────────────────────────
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
        cargarDatos();
        mostrarMensajeros();
        actualizarSelects();
    } else {
        mostrarMensaje('Credenciales incorrectas', 'error', 'Error de acceso');
    }
}

function cerrarSesion() {
    localStorage.removeItem('enviaTrack_sesion');
    document.getElementById('main-panel').style.display = 'none';
    document.getElementById('login-panel').style.display = 'block';
    mostrarMensaje('Sesión cerrada', 'info', 'Hasta luego');
}

function verificarSesion() {
    const sesion = localStorage.getItem('enviaTrack_sesion');
    if (sesion === 'activa') {
        document.getElementById('login-panel').style.display = 'none';
        document.getElementById('main-panel').style.display = 'block';
        cargarDatos();
        mostrarMensajeros();
        actualizarSelects();
    }
}

// ─── Cargar datos ─────────────────────────────────────────────────────────────
function cargarDatos() {
    // Cargar mensajeros
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
    
    // Cargar envíos
    const enviosGuardados = localStorage.getItem('enviaTrack_envios');
    if (enviosGuardados) {
        envios = JSON.parse(enviosGuardados);
    }
}

function guardarMensajeros() {
    localStorage.setItem('enviaTrack_mensajeros', JSON.stringify(mensajeros));
}

function guardarEnvios() {
    localStorage.setItem('enviaTrack_envios', JSON.stringify(envios));
}

// ─── Mostrar mensajeros ───────────────────────────────────────────────────────
function mostrarMensajeros() {
    const contenedor = document.getElementById('tabla-mensajeros');
    if (!contenedor) return;
    
    if (mensajeros.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center; padding:20px;">No hay mensajeros registrados</p>';
        return;
    }
    
    let html = `<table style="width:100%; border-collapse:collapse;">
        <thead style="background-color:#333; color:white;">
            <tr>
                <th style="padding:10px;">Código</th>
                <th style="padding:10px;">Nombre</th>
                <th style="padding:10px;">Teléfono</th>
                <th style="padding:10px;">Envíos Asignados</th>
                <th style="padding:10px;">Acciones</th>
            </tr>
        </thead>
        <tbody>`;
    
    for (let m of mensajeros) {
        const enviosAsignados = envios.filter(e => e.mensajero === m.nombre).length;
        html += `<tr style="border-bottom:1px solid #ddd;">
            <td style="padding:8px;">${m.codigo}</td>
            <td style="padding:8px;">${m.nombre}</td>
            <td style="padding:8px;">${m.telefono}</td>
            <td style="padding:8px; text-align:center;">${enviosAsignados}</td>
            <td style="padding:8px;">
                <button onclick="editarMensajero('${m.codigo}')" class="btn-editar">✏️ Editar</button>
                <button onclick="eliminarMensajero('${m.codigo}')" class="btn-eliminar">🗑️ Eliminar</button>
            </td>
        </tr>`;
    }
    
    html += `</tbody></table>`;
    contenedor.innerHTML = html;
}

// ─── Actualizar selects ───────────────────────────────────────────────────────
function actualizarSelects() {
    const selectEnvio = document.getElementById('select-envio');
    const selectMensajero = document.getElementById('select-mensajero');
    
    if (selectEnvio) {
        selectEnvio.innerHTML = '<option value="">Seleccionar envío...</option>';
        const enviosDisponibles = envios.filter(e => e.estado !== 'entregado');
        for (let e of enviosDisponibles) {
            const asignado = e.mensajero ? ` (Asignado: ${e.mensajero})` : ' (Sin asignar)';
            selectEnvio.innerHTML += `<option value="${e.id}">#${e.id} - ${e.destinatario}${asignado}</option>`;
        }
    }
    
    if (selectMensajero) {
        selectMensajero.innerHTML = '<option value="">Seleccionar mensajero...</option>';
        for (let m of mensajeros) {
            selectMensajero.innerHTML += `<option value="${m.nombre}">${m.codigo} - ${m.nombre}</option>`;
        }
    }
}

// ─── CRUD Mensajeros ──────────────────────────────────────────────────────────
function agregarMensajero() {
    const codigo = document.getElementById('codigo-mensajero').value.trim().toUpperCase();
    const nombre = document.getElementById('nombre-mensajero').value.trim();
    const telefono = document.getElementById('telefono-mensajero').value.trim();
    
    if (!codigo || !nombre || !telefono) {
        mostrarMensaje('Completa todos los campos', 'warning', 'Campos incompletos');
        return;
    }
    
    if (mensajeros.some(m => m.codigo === codigo)) {
        mostrarMensaje('Ya existe un mensajero con este código', 'error', 'Error');
        return;
    }
    
    mensajeros.push({ codigo, nombre, telefono });
    guardarMensajeros();
    
    document.getElementById('codigo-mensajero').value = '';
    document.getElementById('nombre-mensajero').value = '';
    document.getElementById('telefono-mensajero').value = '';
    
    mostrarMensajeros();
    actualizarSelects();
    mostrarMensaje(`Mensajero ${nombre} agregado`, 'success', 'Mensajero creado');
}

function editarMensajero(codigo) {
    const mensajero = mensajeros.find(m => m.codigo === codigo);
    if (!mensajero) return;
    
    const nuevoNombre = prompt('Editar nombre:', mensajero.nombre);
    if (nuevoNombre && nuevoNombre.trim()) {
        const nuevoTelefono = prompt('Editar teléfono:', mensajero.telefono);
        if (nuevoTelefono && nuevoTelefono.trim()) {
            // Actualizar nombre en envíos asignados
            envios.forEach(e => {
                if (e.mensajero === mensajero.nombre) {
                    e.mensajero = nuevoNombre.trim();
                }
            });
            
            mensajero.nombre = nuevoNombre.trim();
            mensajero.telefono = nuevoTelefono.trim();
            guardarMensajeros();
            guardarEnvios();
            mostrarMensajeros();
            actualizarSelects();
            mostrarMensaje(`Mensajero ${codigo} actualizado`, 'success', 'Actualizado');
        }
    }
}

function eliminarMensajero(codigo) {
    const mensajero = mensajeros.find(m => m.codigo === codigo);
    if (!mensajero) return;
    
    const enviosAsignados = envios.filter(e => e.mensajero === mensajero.nombre).length;
    let mensaje = `¿Eliminar mensajero ${mensajero.nombre}?`;
    
    if (enviosAsignados > 0) {
        mensaje += `\n\n⚠️ Este mensajero tiene ${enviosAsignados} envíos asignados. Si lo eliminas, estos envíos quedarán sin mensajero.`;
    }
    
    if (confirm(mensaje)) {
        // Desasignar envíos
        envios.forEach(e => {
            if (e.mensajero === mensajero.nombre) {
                e.mensajero = null;
            }
        });
        
        const index = mensajeros.findIndex(m => m.codigo === codigo);
        mensajeros.splice(index, 1);
        
        guardarMensajeros();
        guardarEnvios();
        mostrarMensajeros();
        actualizarSelects();
        mostrarMensaje(`Mensajero ${mensajero.nombre} eliminado`, 'warning', 'Eliminado');
    }
}

function asignarMensajero() {
    const envioId = document.getElementById('select-envio').value;
    const mensajeroNombre = document.getElementById('select-mensajero').value;
    
    if (!envioId || !mensajeroNombre) {
        mostrarMensaje('Selecciona un envío y un mensajero', 'warning', 'Selección requerida');
        return;
    }
    
    const envio = envios.find(e => e.id === parseInt(envioId));
    if (!envio) return;
    
    const mensajero = mensajeros.find(m => m.nombre === mensajeroNombre);
    if (!mensajero) return;
    
    envio.mensajero = mensajero.nombre;
    guardarEnvios();
    
    actualizarSelects();
    mostrarMensajeros();
    mostrarMensaje(`Envío #${envio.id} asignado a ${mensajero.nombre}`, 'success', 'Asignación completada');
}

// ─── Modo Oscuro ──────────────────────────────────────────────────────────────
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

// ─── Eventos e Inicialización ─────────────────────────────────────────────────
document.getElementById('btn-login')?.addEventListener('click', iniciarSesion);
document.getElementById('btn-logout')?.addEventListener('click', cerrarSesion);
document.getElementById('btn-agregar-mensajero')?.addEventListener('click', agregarMensajero);
document.getElementById('btn-asignar')?.addEventListener('click', asignarMensajero);
document.getElementById('btn-dark-mode')?.addEventListener('click', toggleDarkMode);

// Permitir login con Enter
document.getElementById('login-password')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') iniciarSesion();
});

initDarkMode();
verificarSesion();