// Datos de mensajeros
let mensajeros = [];
let envios = [];

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

// Cargar datos
function cargarDatos() {
    // Cargar mensajeros
    let mensajerosGuardados = localStorage.getItem('enviaTrack_mensajeros');
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
    let enviosGuardados = localStorage.getItem('enviaTrack_envios');
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

// Mostrar tabla de mensajeros
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
    
    for (let i = 0; i < mensajeros.length; i++) {
        const m = mensajeros[i];
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

// Actualizar select de envíos
function actualizarSelectEnvios() {
    const select = document.getElementById('select-envio');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar envío...</option>';
    
    // Mostrar solo envíos pendientes o en ruta
    const enviosDisponibles = envios.filter(e => e.estado !== 'entregado');
    
    for (let e of enviosDisponibles) {
        const asignado = e.mensajero ? ` (Asignado: ${e.mensajero})` : ' (Sin asignar)';
        select.innerHTML += `<option value="${e.id}">#${e.id} - ${e.destinatario}${asignado}</option>`;
    }
}

// Actualizar select de mensajeros
function actualizarSelectMensajeros() {
    const select = document.getElementById('select-mensajero');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar mensajero...</option>';
    
    for (let m of mensajeros) {
        select.innerHTML += `<option value="${m.nombre}">${m.codigo} - ${m.nombre}</option>`;
    }
}

// Agregar mensajero
function agregarMensajero() {
    const codigo = document.getElementById('codigo-mensajero').value.trim().toUpperCase();
    const nombre = document.getElementById('nombre-mensajero').value.trim();
    const telefono = document.getElementById('telefono-mensajero').value.trim();
    
    if (!codigo || !nombre || !telefono) {
        mostrarNotificacion('Completa todos los campos', 'warning', 'Campos incompletos');
        return;
    }
    
    if (mensajeros.some(m => m.codigo === codigo)) {
        mostrarNotificacion('Ya existe un mensajero con este código', 'error', 'Error');
        return;
    }
    
    mensajeros.push({ codigo, nombre, telefono });
    guardarMensajeros();
    
    document.getElementById('codigo-mensajero').value = '';
    document.getElementById('nombre-mensajero').value = '';
    document.getElementById('telefono-mensajero').value = '';
    
    mostrarMensajeros();
    actualizarSelectMensajeros();
    mostrarNotificacion(`Mensajero ${nombre} agregado`, 'success', 'Mensajero creado');
}

// Editar mensajero
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
            actualizarSelectEnvios();
            mostrarNotificacion(`Mensajero ${codigo} actualizado`, 'success', 'Actualizado');
        }
    }
}

// Eliminar mensajero
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
        actualizarSelectEnvios();
        actualizarSelectMensajeros();
        mostrarNotificacion(`Mensajero ${mensajero.nombre} eliminado`, 'warning', 'Eliminado');
    }
}

// Asignar mensajero a envío
function asignarMensajero() {
    const envioId = document.getElementById('select-envio').value;
    const mensajeroNombre = document.getElementById('select-mensajero').value;
    
    if (!envioId || !mensajeroNombre) {
        mostrarNotificacion('Selecciona un envío y un mensajero', 'warning', 'Selección requerida');
        return;
    }
    
    const envio = envios.find(e => e.id === parseInt(envioId));
    if (!envio) return;
    
    const mensajero = mensajeros.find(m => m.nombre === mensajeroNombre);
    if (!mensajero) return;
    
    envio.mensajero = mensajero.nombre;
    guardarEnvios();
    
    actualizarSelectEnvios();
    mostrarNotificacion(`Envío #${envio.id} asignado a ${mensajero.nombre}`, 'success', 'Asignación completada');
    
    // Actualizar tabla de mensajeros
    mostrarMensajeros();
}

// Inicializar
function init() {
    cargarDatos();
    mostrarMensajeros();
    actualizarSelectEnvios();
    actualizarSelectMensajeros();
}

// Eventos
document.getElementById('btn-agregar-mensajero')?.addEventListener('click', agregarMensajero);
document.getElementById('btn-asignar')?.addEventListener('click', asignarMensajero);

init();