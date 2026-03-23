// Datos de ejemplo para pruebas (se usarán solo si no hay datos guardados)
const datosIniciales = [
    {
        id: 1,
        destinatario: "María González",
        direccion: "Calle 45 # 20-30, Bogotá",
        telefono: "3001234567",
        estado: "pendiente",
        mensajero: null,
        fechaCreacion: "2025-03-22 10:30"
    },
    {
        id: 2,
        destinatario: "Carlos Rodríguez",
        direccion: "Carrera 15 # 88-12, Medellín",
        telefono: "3109876543",
        estado: "en_ruta",
        mensajero: "Pedro Martínez",
        fechaCreacion: "2025-03-22 09:15"
    },
    {
        id: 3,
        destinatario: "Ana Lucía Fernández",
        direccion: "Avenida 19 # 123-45, Cali",
        telefono: "3155558888",
        estado: "entregado",
        mensajero: "Luis Torres",
        fechaCreacion: "2025-03-21 16:20",
        fechaEntrega: "2025-03-21 17:45"
    }
];

// Variable para los envíos (se cargarán desde localStorage o se usarán los iniciales)
let envios = [];

// Variable para el próximo ID disponible
let proximoId = 1;

// Función para guardar envíos en localStorage
function guardarEnvios() {
    localStorage.setItem('enviaTrack_envios', JSON.stringify(envios));
    localStorage.setItem('enviaTrack_proximoId', proximoId);
    console.log('💾 Datos guardados automáticamente');
}

// Función para cargar envíos desde localStorage
function cargarEnvios() {
    const datosGuardados = localStorage.getItem('enviaTrack_envios');
    const idGuardado = localStorage.getItem('enviaTrack_proximoId');
    
    if (datosGuardados) {
        envios = JSON.parse(datosGuardados);
        console.log('📂 Datos cargados desde localStorage:', envios.length, 'envíos');
    }
    
    if (idGuardado) {
        proximoId = parseInt(idGuardado);
    } else if (envios.length > 0) {
        const ids = envios.map(e => e.id);
        proximoId = Math.max(...ids, 0) + 1;
    }
}

// Función para inicializar datos (cargar guardados o usar iniciales)
function inicializarDatos() {
    cargarEnvios();
    
    if (envios.length === 0) {
        envios = JSON.parse(JSON.stringify(datosIniciales));
        const ids = envios.map(e => e.id);
        proximoId = Math.max(...ids, 0) + 1;
        guardarEnvios();
        console.log('📦 Datos iniciales cargados');
    }
}

// Función para mostrar los envíos en una tabla
function mostrarEnvios(enviosAMostrar = null) {
    const contenedor = document.getElementById('tabla-envios');
    
    if (!contenedor) {
        console.error('No se encontró el contenedor tabla-envios');
        return;
    }
    
    const datos = enviosAMostrar !== null ? enviosAMostrar : envios;
    
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
                    <th style="padding: 10px;">Mensajero</th>
                    <th style="padding: 10px;">Fecha Creación</th>
                    <th style="padding: 10px;">Fecha Entrega</th>
                    <th style="padding: 10px;">Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    for (let i = 0; i < datos.length; i++) {
        const envio = datos[i];
        
        let botones = '';
        
        if (envio.estado === 'pendiente') {
            botones = `<button onclick="cambiarEstado(${envio.id}, 'en_ruta')" style="background-color: #3498db; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px;">🚚 Iniciar Ruta</button>`;
            botones += `<button onclick="eliminarEnvio(${envio.id})" style="background-color: #e74c3c; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;">🗑️ Eliminar</button>`;
        } else if (envio.estado === 'en_ruta') {
            botones = `<button onclick="cambiarEstado(${envio.id}, 'entregado')" style="background-color: #27ae60; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; margin-right: 5px;">✅ Marcar Entregado</button>`;
            botones += `<button onclick="eliminarEnvio(${envio.id})" style="background-color: #e74c3c; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;">🗑️ Eliminar</button>`;
        } else if (envio.estado === 'entregado') {
            botones = `<span style="color: #27ae60; margin-right: 10px;">✓ Completado</span>`;
            botones += `<button onclick="eliminarEnvio(${envio.id})" style="background-color: #e74c3c; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer;">🗑️ Eliminar</button>`;
        }
        
        html += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; text-align: center;">${envio.id}</td>
                <td style="padding: 8px;">${envio.destinatario}</td>
                <td style="padding: 8px;">${envio.direccion}</td>
                <td style="padding: 8px;">${envio.telefono}</td>
                <td style="padding: 8px;" class="${estadoClase[envio.estado]}">${estadoTexto[envio.estado]}</td>
                <td style="padding: 8px;">${envio.mensajero || 'Sin asignar'}</td>
                <td style="padding: 8px;">${envio.fechaCreacion}</td>
                <td style="padding: 8px;">${envio.fechaEntrega || '—'}</td>
                <td style="padding: 8px; text-align: center;">${botones}</td>
             </tr>
        `;
    }
    
    html += `
            </tbody>
        </table>
    `;
    
    if (datos.length === 0) {
        html = '<p style="text-align: center; padding: 20px;">No hay envíos que coincidan con la búsqueda</p>';
    }
    
    contenedor.innerHTML = html;
    console.log('Tabla de envíos generada correctamente');
}

// Función para filtrar envíos
function filtrarEnvios() {
    const textoBusqueda = document.getElementById('buscador').value.toLowerCase();
    
    if (textoBusqueda === '') {
        mostrarEnvios(envios);
        return;
    }
    
    const filtrados = envios.filter(envio => {
        return envio.destinatario.toLowerCase().includes(textoBusqueda) ||
               envio.direccion.toLowerCase().includes(textoBusqueda);
    });
    
    mostrarEnvios(filtrados);
}

// Función para cambiar el estado de un envío
function cambiarEstado(id, nuevoEstado) {
    const envio = envios.find(e => e.id === id);
    
    if (!envio) {
        alert('Error: No se encontró el envío');
        return;
    }
    
    const estadoAnterior = envio.estado;
    envio.estado = nuevoEstado;
    
    if (nuevoEstado === 'entregado') {
        envio.fechaEntrega = new Date().toLocaleString();
        console.log(`📦 Envío #${id} entregado a ${envio.destinatario} a las ${envio.fechaEntrega}`);
        alert(`✅ Envío #${id} marcado como ENTREGADO`);
    } else if (nuevoEstado === 'en_ruta') {
        if (!envio.mensajero) {
            envio.mensajero = 'Mensajero Asignado';
        }
        console.log(`🚚 Envío #${id} está en ruta con mensajero: ${envio.mensajero}`);
        alert(`🚚 Envío #${id} está en RUTA`);
    }
    
    filtrarEnvios();
    actualizarContadores();
    guardarEnvios();
    
    console.log(`Envío #${id}: ${estadoAnterior} → ${nuevoEstado}`);
}

// Función para agregar un nuevo envío
function agregarEnvio(evento) {
    evento.preventDefault();
    
    const destinatario = document.getElementById('destinatario').value;
    const direccion = document.getElementById('direccion').value;
    const telefono = document.getElementById('telefono').value;
    
    if (!destinatario || !direccion || !telefono) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    const nuevoEnvio = {
        id: proximoId,
        destinatario: destinatario,
        direccion: direccion,
        telefono: telefono,
        estado: 'pendiente',
        mensajero: null,
        fechaCreacion: new Date().toLocaleString()
    };
    
    envios.push(nuevoEnvio);
    proximoId++;
    document.getElementById('form-nuevo-envio').reset();
    
    filtrarEnvios();
    actualizarContadores();
    guardarEnvios();
    
    console.log('Nuevo envío registrado:', nuevoEnvio);
    alert('✅ Envío registrado correctamente');
}

// Función para eliminar un envío
function eliminarEnvio(id) {
    const envio = envios.find(e => e.id === id);
    
    if (!envio) {
        alert('Error: No se encontró el envío');
        return;
    }
    
    const confirmar = confirm(`¿Estás seguro de eliminar el envío #${id} de ${envio.destinatario}?`);
    
    if (confirmar) {
        const indice = envios.findIndex(e => e.id === id);
        envios.splice(indice, 1);
        
        filtrarEnvios();
        actualizarContadores();
        guardarEnvios();
        
        console.log(`🗑️ Envío #${id} eliminado correctamente`);
        alert(`🗑️ Envío #${id} eliminado`);
    }
}

// Función para actualizar los contadores de estadísticas
function actualizarContadores() {
    const pendientes = envios.filter(e => e.estado === 'pendiente').length;
    const enRuta = envios.filter(e => e.estado === 'en_ruta').length;
    const entregados = envios.filter(e => e.estado === 'entregado').length;
    const total = envios.length;
    
    const contadorPendiente = document.getElementById('contador-pendiente');
    const contadorEnRuta = document.getElementById('contador-en-ruta');
    const contadorEntregado = document.getElementById('contador-entregado');
    const contadorTotal = document.getElementById('contador-total');
    
    if (contadorPendiente) contadorPendiente.textContent = pendientes;
    if (contadorEnRuta) contadorEnRuta.textContent = enRuta;
    if (contadorEntregado) contadorEntregado.textContent = entregados;
    if (contadorTotal) contadorTotal.textContent = total;
    
    console.log(`Estadísticas: Pendientes: ${pendientes}, En Ruta: ${enRuta}, Entregados: ${entregados}, Total: ${total}`);
}

// Función para exportar envíos a CSV (Excel)
function exportarACSV() {
    const encabezados = ['ID', 'Destinatario', 'Dirección', 'Teléfono', 'Estado', 'Mensajero', 'Fecha Creación', 'Fecha Entrega'];
    
    const datosExportar = envios.map(envio => {
        const estadoTexto = {
            'pendiente': 'Pendiente',
            'en_ruta': 'En Ruta',
            'entregado': 'Entregado'
        };
        
        return [
            envio.id,
            envio.destinatario,
            envio.direccion,
            envio.telefono,
            estadoTexto[envio.estado] || envio.estado,
            envio.mensajero || 'Sin asignar',
            envio.fechaCreacion,
            envio.fechaEntrega || ''
        ];
    });
    
    const filas = [encabezados, ...datosExportar];
    
    const contenidoCSV = filas.map(fila => 
        fila.map(celda => {
            const celdaStr = String(celda);
            if (celdaStr.includes(',') || celdaStr.includes('"') || celdaStr.includes('\n')) {
                return `"${celdaStr.replace(/"/g, '""')}"`;
            }
            return celdaStr;
        }).join(',')
    ).join('\n');
    
    const blob = new Blob(['\uFEFF' + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `envios_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('📊 Envíos exportados a CSV');
    alert(`📊 Exportados ${envios.length} envíos correctamente`);
}

// Escuchar eventos
const formulario = document.getElementById('form-nuevo-envio');
if (formulario) {
    formulario.addEventListener('submit', agregarEnvio);
}

const buscador = document.getElementById('buscador');
if (buscador) {
    buscador.addEventListener('input', filtrarEnvios);
}

const btnExportar = document.getElementById('btn-exportar');
if (btnExportar) {
    btnExportar.addEventListener('click', exportarACSV);
}

// Inicializar la aplicación
inicializarDatos();
mostrarEnvios();
actualizarContadores();