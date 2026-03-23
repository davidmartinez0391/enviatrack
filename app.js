// Base de datos local
let envios = [];

let proximoId = 1;
// Función para normalizar texto (quitar tildes y convertir a minúsculas)
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

function cargarDatos() {
    let datos = localStorage.getItem('enviaTrack_envios');
    let idGuardado = localStorage.getItem('enviaTrack_proximoId');
    
    if (datos) {
        envios = JSON.parse(datos);
        console.log('✅ Cargados ' + envios.length + ' envíos');
    } else {
        envios = [
            { id: 1, destinatario: "María González", direccion: "Calle 45 # 20-30, Bogotá", telefono: "3001234567", estado: "pendiente", mensajero: null, fechaCreacion: "2025-03-22 10:30" },
            { id: 2, destinatario: "Carlos Rodríguez", direccion: "Carrera 15 # 88-12, Medellín", telefono: "3109876543", estado: "en_ruta", mensajero: "Pedro Martínez", fechaCreacion: "2025-03-22 09:15" },
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
    let contenedor = document.getElementById('tabla-envios');
    if (!contenedor) return;
    
    let texto = normalizarTexto(document.getElementById('buscador').value);
    let filtrados = envios;
    
    if (texto !== '') {
        filtrados = envios.filter(e => {
            let destinatarioNorm = normalizarTexto(e.destinatario);
            let direccionNorm = normalizarTexto(e.direccion);
            return destinatarioNorm.includes(texto) || direccionNorm.includes(texto);
        });
    }
    
    let html = '<table style="width:100%; border-collapse:collapse;"><thead style="background:#333; color:white;"><tr>';
    html += '<th style="padding:10px;">ID</th><th style="padding:10px;">Destinatario</th><th style="padding:10px;">Dirección</th><th style="padding:10px;">Teléfono</th>';
    html += '<th style="padding:10px;">Estado</th><th style="padding:10px;">Mensajero</th><th style="padding:10px;">Fecha Creación</th><th style="padding:10px;">Fecha Entrega</th><th style="padding:10px;">Acciones</th></tr></thead><tbody>';
    
    for (let i = 0; i < filtrados.length; i++) {
        let e = filtrados[i];
        let estadoText = { 'pendiente': '⏳ Pendiente', 'en_ruta': '🚚 En ruta', 'entregado': '✅ Entregado' };
        let estadoClass = { 'pendiente': 'estado-pendiente', 'en_ruta': 'estado-en-ruta', 'entregado': 'estado-entregado' };
        
        let botones = '';
        if (e.estado === 'pendiente') {
            botones = '<button onclick="iniciarRuta(' + e.id + ')" style="background:#3498db; color:white; padding:5px 10px; margin-right:5px; border:none; border-radius:3px;">🚚 Iniciar Ruta</button>';
            botones += '<button onclick="eliminarEnvio(' + e.id + ')" style="background:#e74c3c; color:white; padding:5px 10px; border:none; border-radius:3px;">🗑️ Eliminar</button>';
        } else if (e.estado === 'en_ruta') {
            botones = '<button onclick="marcarEntregado(' + e.id + ')" style="background:#27ae60; color:white; padding:5px 10px; margin-right:5px; border:none; border-radius:3px;">✅ Marcar Entregado</button>';
            botones += '<button onclick="eliminarEnvio(' + e.id + ')" style="background:#e74c3c; color:white; padding:5px 10px; border:none; border-radius:3px;">🗑️ Eliminar</button>';
        } else {
            botones = '<span style="color:#27ae60;">✓ Completado</span>';
            botones += '<button onclick="eliminarEnvio(' + e.id + ')" style="background:#e74c3c; color:white; padding:5px 10px; margin-left:5px; border:none; border-radius:3px;">🗑️ Eliminar</button>';
        }
        
        html += '<tr style="border-bottom:1px solid #ddd;">';
        html += '<td style="padding:8px; text-align:center;">' + e.id + '</td>';
        html += '<td style="padding:8px;">' + e.destinatario + '</td>';
        html += '<td style="padding:8px;">' + e.direccion + '</td>';
        html += '<td style="padding:8px;">' + e.telefono + '</td>';
        html += '<td style="padding:8px;" class="' + estadoClass[e.estado] + '">' + estadoText[e.estado] + '</td>';
        html += '<td style="padding:8px;">' + (e.mensajero || 'Sin asignar') + '</td>';
        html += '<td style="padding:8px;">' + e.fechaCreacion + '</td>';
        html += '<td style="padding:8px;">' + (e.fechaEntrega || '—') + '</td>';
        html += '<td style="padding:8px; text-align:center;">' + botones + '</td>';
        html += '</tr>';
    }
    
    html += '</tbody></table>';
    
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
}

function iniciarRuta(id) {
    let e = envios.find(x => x.id === id);
    if (e) {
        e.estado = 'en_ruta';
        if (!e.mensajero) e.mensajero = 'Mensajero Asignado';
        guardarDatos();
        mostrarTabla();
        alert('🚚 Envío #' + id + ' está en RUTA');
    }
}

function marcarEntregado(id) {
    let e = envios.find(x => x.id === id);
    if (e) {
        e.estado = 'entregado';
        e.fechaEntrega = new Date().toLocaleString();
        guardarDatos();
        mostrarTabla();
        alert('✅ Envío #' + id + ' marcado como ENTREGADO');
    }
}

function eliminarEnvio(id) {
    let e = envios.find(x => x.id === id);
    if (e && confirm('¿Eliminar envío #' + id + ' de ' + e.destinatario + '?')) {
        let idx = envios.findIndex(x => x.id === id);
        envios.splice(idx, 1);
        guardarDatos();
        mostrarTabla();
        alert('🗑️ Envío #' + id + ' eliminado');
    }
}

function agregarEnvio() {
    let dest = document.getElementById('destinatario').value;
    let dir = document.getElementById('direccion').value;
    let tel = document.getElementById('telefono').value;
    
    if (!dest || !dir || !tel) {
        alert('Completa todos los campos');
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
    
    alert('✅ Envío registrado');
    return false;
}

function exportarCSV() {
    let contenido = 'ID,Destinatario,Dirección,Teléfono,Estado,Mensajero,Fecha Creación,Fecha Entrega\n';
    for (let e of envios) {
        let estadoText = { 'pendiente': 'Pendiente', 'en_ruta': 'En Ruta', 'entregado': 'Entregado' };
        contenido += e.id + ',' + e.destinatario + ',' + e.direccion + ',' + e.telefono + ',';
        contenido += estadoText[e.estado] + ',' + (e.mensajero || 'Sin asignar') + ',' + e.fechaCreacion + ',' + (e.fechaEntrega || '') + '\n';
    }
    let blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'envios_' + new Date().toLocaleDateString() + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    alert('📊 Exportados ' + envios.length + ' envíos');
}

cargarDatos();
mostrarTabla();

document.getElementById('form-nuevo-envio').addEventListener('submit', function(e) {
    e.preventDefault();
    agregarEnvio();
});

document.getElementById('buscador').addEventListener('input', function() {
    mostrarTabla();
});

document.getElementById('btn-exportar').addEventListener('click', function() {
    exportarCSV();
});