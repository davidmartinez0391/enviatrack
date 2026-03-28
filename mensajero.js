// Datos de mensajeros (se cargan desde localStorage)
let mensajerosRegistrados = [];

// Variable para el mensajero actual
let mensajeroActual = null;

// Función para cargar mensajeros desde localStorage
async function cargarMensajeros() {
    try {
        // Intentar sincronizar desde la web
        const response = await fetch('https://davidmartinez0391.github.io/enviatrack/data.json');
        const data = await response.json();
        
        if (data.mensajeros && data.mensajeros.length > 0) {
            mensajerosRegistrados = data.mensajeros;
            guardarMensajeros();
            console.log('📡 Mensajeros sincronizados desde la web:', mensajerosRegistrados.length);
        }
        
        // También sincronizar envíos
        if (data.envios && data.envios.length > 0) {
            localStorage.setItem('enviaTrack_envios', JSON.stringify(data.envios));
            console.log('📦 Envíos sincronizados:', data.envios.length);
        }
        
        // Mostrar códigos disponibles
        console.log('Códigos disponibles:', mensajerosRegistrados.map(m => m.codigo).join(', '));
        
    } catch (error) {
        console.error('Error al sincronizar desde web:', error);
        // Si falla, usar datos locales
        const datosGuardados = localStorage.getItem('enviaTrack_mensajeros');
        if (datosGuardados) {
            mensajerosRegistrados = JSON.parse(datosGuardados);
        } else {
            mensajerosRegistrados = [
                { codigo: "MEN001", nombre: "Pedro Martínez", telefono: "3109876543" },
                { codigo: "MEN002", nombre: "Luis Torres", telefono: "3155558888" },
                { codigo: "MEN003", nombre: "Ana Ramírez", telefono: "3001112233" }
            ];
            guardarMensajeros();
        }
    }
}
async function sincronizarEnvios() {
    try {
        console.log('🔄 Sincronizando envíos desde web...');
        const response = await fetch('https://davidmartinez0391.github.io/enviatrack/data.json');
        const data = await response.json();
        
        console.log('📦 Datos recibidos:', data);
        
        if (data.envios && data.envios.length > 0) {
            localStorage.setItem('enviaTrack_envios', JSON.stringify(data.envios));
            console.log('✅ Envíos sincronizados:', data.envios.length);
            console.log('📋 Lista de envíos:', data.envios);
            return true;
        } else {
            console.log('⚠️ No hay envíos en data.json');
            return false;
        }
    } catch (error) {
        console.error('❌ Error al sincronizar envíos:', error);
        return false;
    }
}
function guardarMensajeros() {
    localStorage.setItem('enviaTrack_mensajeros', JSON.stringify(mensajerosRegistrados));
}

// Función para cargar envíos desde localStorage
function cargarEnvios() {
    const datosGuardados = localStorage.getItem('enviaTrack_envios');
    if (datosGuardados) {
        return JSON.parse(datosGuardados);
    }
    return [];
}

// Función para guardar envíos
function guardarEnvios(envios) {
    localStorage.setItem('enviaTrack_envios', JSON.stringify(envios));
}

// Función para mostrar los envíos del mensajero
function mostrarEnviosMensajero(enviosAMostrar = null) {
    const contenedor = document.getElementById('tabla-envios-mensajero');
    
    if (!contenedor) return;
    
    let envios = enviosAMostrar !== null ? enviosAMostrar : cargarEnvios();
    
    // Filtrar solo los envíos asignados a este mensajero
    envios = envios.filter(envio => envio.mensajero === mensajeroActual.nombre);
    
    const estadoTexto = {
        'pendiente': '⏳ Pendiente',
        'en_ruta': '🚚 En ruta',
        'entregado': '✅ Entregado'
    };
    
    const estadoClase = {
        'pendiente': 'estado-pendiente',
        'en_ruta': 'estado-en-ruta',
        'entregado': 'estado-entregado'
    };
    
    let html = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead style="background-color: #333; color: white;">
                <tr>
                    <th style="padding: 10px;">ID</th>
                    <th style="padding: 10px;">Destinatario</th>
                    <th style="padding: 10px;">Dirección</th>
                    <th style="padding: 10px;">Teléfono</th>
                    <th style="padding: 10px;">Estado</th>
                    <th style="padding: 10px;">Fecha Creación</th>
                    <th style="padding: 10px;">Acciones</th>
                 </tr>
            </thead>
            <tbody>
    `;
    
    for (let i = 0; i < envios.length; i++) {
        const envio = envios[i];
        
        let botones = '';
        
        if (envio.estado === 'pendiente') {
            botones = `<button onclick="actualizarEstado(${envio.id}, 'en_ruta')" style="background-color: #3498db; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;">🚚 Iniciar Ruta</button>`;
        } else if (envio.estado === 'en_ruta') {
            botones = `<button onclick="actualizarEstado(${envio.id}, 'entregado')" style="background-color: #27ae60; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;">✅ Marcar Entregado</button>`;
        } else if (envio.estado === 'entregado') {
            botones = `<span style="color: #27ae60;">✓ Entregado</span>`;
        }
        
        html += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; text-align: center;">${envio.id}</td>
                <td style="padding: 8px;">${envio.destinatario}</td>
                <td style="padding: 8px;">${envio.direccion}</td>
                <td style="padding: 8px;">${envio.telefono}</td>
                <td style="padding: 8px;" class="${estadoClase[envio.estado]}">${estadoTexto[envio.estado]}</td>
                <td style="padding: 8px;">${envio.fechaCreacion}</td>
                <td style="padding: 8px; text-align: center;">${botones}</td>
             </tr>
        `;
    }
    
    html += `
            </tbody>
         </table>
    `;
    
    if (envios.length === 0) {
        html = '<p style="text-align: center; padding: 20px;">No tienes envíos asignados</p>';
    }
    
    contenedor.innerHTML = html;
}

// Función para filtrar envíos del mensajero
function filtrarEnviosMensajero() {
    const textoBusqueda = document.getElementById('buscador-mensajero').value.toLowerCase();
    let todosEnvios = cargarEnvios();
    
    console.log('🔍 Todos los envíos en localStorage:', todosEnvios);
    console.log('👤 Mensajero actual:', mensajeroActual);
    console.log('📌 Buscando envíos con mensajero =', mensajeroActual?.nombre);
    
    let enviosFiltrados = todosEnvios.filter(envio => envio.mensajero === mensajeroActual.nombre);
    
    console.log('✅ Envíos del mensajero:', enviosFiltrados);
    
    if (textoBusqueda !== '') {
        enviosFiltrados = enviosFiltrados.filter(envio => {
            return envio.destinatario.toLowerCase().includes(textoBusqueda) ||
                   envio.direccion.toLowerCase().includes(textoBusqueda);
        });
    }
    
    mostrarEnviosMensajero(enviosFiltrados);
}
// Función para actualizar estado del envío
function actualizarEstado(id, nuevoEstado) {
    let envios = cargarEnvios();
    const envio = envios.find(e => e.id === id);
    
    if (!envio) {
        alert('Error: No se encontró el envío');
        return;
    }
    
    if (envio.mensajero !== mensajeroActual.nombre) {
        alert('No tienes permiso para modificar este envío');
        return;
    }
    
    const estadoAnterior = envio.estado;
    envio.estado = nuevoEstado;
    
    if (nuevoEstado === 'entregado') {
        envio.fechaEntrega = new Date().toLocaleString();
        alert(`✅ Envío #${id} marcado como ENTREGADO`);
    } else if (nuevoEstado === 'en_ruta') {
        alert(`🚚 Envío #${id} está en RUTA`);
    }
    
    // Guardar cambios
    guardarEnvios(envios);
    
    // Actualizar vista
    filtrarEnviosMensajero();
    
    console.log(`Mensajero ${mensajeroActual.nombre}: Envío #${id} ${estadoAnterior} → ${nuevoEstado}`);
}

// Función de login
async function iniciarSesion() {
    const codigo = document.getElementById('codigo-mensajero').value.trim().toUpperCase();
    
    if (!codigo) {
        alert('Por favor ingresa tu código de mensajero');
        return;
    }
    
    // Sincronizar mensajeros y envíos
    await cargarMensajeros();
    await sincronizarEnvios();
    
    console.log('Buscando código:', codigo);
    console.log('Mensajeros disponibles:', mensajerosRegistrados);
    
    const mensajero = mensajerosRegistrados.find(m => m.codigo === codigo);
    
    if (!mensajero) {
        alert('❌ Código incorrecto. Los códigos disponibles son: ' + mensajerosRegistrados.map(m => m.codigo).join(', '));
        return;
    }
    
    mensajeroActual = mensajero;
    
    document.getElementById('login-panel').classList.add('oculto');
    document.getElementById('panel-mensajero').classList.remove('oculto');
    
    document.getElementById('info-mensajero').innerHTML = `
        <strong>👤 Mensajero:</strong> ${mensajeroActual.nombre} | 
        <strong>📱 Código:</strong> ${mensajeroActual.codigo} | 
        <strong>📞 Teléfono:</strong> ${mensajeroActual.telefono}
    `;
    
    filtrarEnviosMensajero();
    
    console.log(`✅ Mensajero ${mensajeroActual.nombre} ha iniciado sesión`);
}

// Función de cerrar sesión
function cerrarSesion() {
    mensajeroActual = null;
    
    // Mostrar login y ocultar panel
    document.getElementById('login-panel').classList.remove('oculto');
    document.getElementById('panel-mensajero').classList.add('oculto');
    
    // Limpiar campos
    document.getElementById('codigo-mensajero').value = '';
    document.getElementById('buscador-mensajero').value = '';
    
    console.log('👋 Sesión cerrada');
}

// Eventos
document.getElementById('btn-login').addEventListener('click', iniciarSesion);
document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesion);
document.getElementById('buscador-mensajero').addEventListener('input', filtrarEnviosMensajero);

// Permitir login con Enter
document.getElementById('codigo-mensajero').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        iniciarSesion();
    }
});

// Cargar mensajeros al iniciar
cargarMensajeros();
document.getElementById('btn-sincronizar')?.addEventListener('click', async () => {
    await sincronizarEnvios();
    if (mensajeroActual) {
        filtrarEnviosMensajero();
        alert('✅ Datos sincronizados');
    }
});