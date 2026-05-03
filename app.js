if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => console.log('Service Worker registrado', reg))
    .catch(err => console.error('Error al registrar', err));
}

async function guardarVideoEnSD(nombreArchivo, blobVideo) {
  try {
    // 1. Pedir al usuario que elija dónde guardar (él elegirá la SD)
    const handle = await window.showSaveFilePicker({
      suggestedName: nombreArchivo,
      types: [{
        description: 'Video File',
        accept: {'video/mp4': ['.mp4']},
      }],
    });

    // 2. Crear un stream para escribir el archivo
    const writable = await handle.createWritable();
    await writable.write(blobVideo);
    await writable.close();
    
    alert("Video guardado en la memoria SD con éxito");
  } catch (err) {
    console.error("Error al guardar:", err);
  }
}

import { set, get } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

// Guardar un link
await set('video_1', { url: 'https://...', titulo: 'Mi Video' });

// Obtener la lista
const video = await get('video_1');
//////////////////

const miApiCobalt = "https://cobalt-api-production-2724.up.railway.app/";

async function descargarVideo(urlDeYouTube) {
  const response = await fetch(miApiCobalt + "api/json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      url: urlDeYouTube,
      vQuality: "720" // Calidad deseada
    })
  });

  const data = await response.json();
  
  if (data.url) {
    console.log("Enlace de descarga listo:", data.url);
    // Aquí llamarías a la función para guardar en la SD
  }
}

// CONFIGURACIÓN
const COBALT_API = "https://cobalt-api-production-2724.up.railway.app/api/json";
let db;

// 1. INICIALIZAR BASE DE DATOS (IndexedDB)
const request = indexedDB.open("VaultStreamDB", 1);
request.onupgradeneeded = (e) => {
    db = e.target.result;
    db.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
};
request.onsuccess = (e) => {
    db = e.target.result;
    renderizarLista();
};

// 2. AGREGAR VIDEO A LA LISTA
async function agregarALista() {
    const urlInput = document.getElementById('videoUrl');
    if (!urlInput.value) return;

    const nuevoVideo = {
        url: urlInput.value,
        titulo: "Video pendiente",
        fecha: new Date().toLocaleDateString(),
        estado: "pendiente"
    };

    const transaction = db.transaction(["videos"], "readwrite");
    transaction.objectStore("videos").add(nuevoVideo);
    
    urlInput.value = "";
    transaction.oncomplete = renderizarLista;
}

// 3. RENDERIZAR LA LISTA EN EL HTML
function renderizarLista() {
    const listElement = document.getElementById('videoList');
    listElement.innerHTML = "";
    
    db.transaction("videos").objectStore("videos").getAll().onsuccess = (e) => {
        e.target.result.forEach(video => {
            listElement.innerHTML += `
                <div class="video-card">
                    <div class="video-info">
                        <h3>${video.titulo}</h3>
                        <small>${video.url}</small>
                    </div>
                    <div class="actions">
                        <button class="btn-download" onclick="procesarDescarga(${video.id}, '${video.url}')">
                            ${video.estado === 'pendiente' ? '📥 Bajar a SD' : '✅ Guardado'}
                        </button>
                    </div>
                </div>
            `;
        });
    };
}

// 4. PROCESAR DESCARGA CON COBALT Y GUARDAR EN SD
async function procesarDescarga(id, urlVideo) {
    try {
        console.log("Conectando con Cobalt...");
        
        const response = await fetch(COBALT_API, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ url: urlVideo, vQuality: "720" })
        });

        const data = await response.json();
        if (!data.url) throw new Error("No se obtuvo URL de descarga");

        // Descargar el archivo binario (Blob)
        const videoRes = await fetch(data.url);
        const videoBlob = await videoRes.blob();

        // GUARDAR EN SD (Usando File System Access API)
        const handle = await window.showSaveFilePicker({
            suggestedName: `video_${id}.mp4`,
            types: [{ description: 'Video MP4', accept: {'video/mp4': ['.mp4']} }]
        });

        const writable = await handle.createWritable();
        await writable.write(videoBlob);
        await writable.close();

        // Actualizar estado en DB
        const tx = db.transaction(["videos"], "readwrite");
        const store = tx.objectStore("videos");
        store.get(id).onsuccess = (e) => {
            const data = e.target.result;
            data.estado = "descargado";
            store.put(data);
        };
        tx.oncomplete = renderizarLista;

        alert("¡Guardado en la SD correctamente!");
    } catch (err) {
        console.error("Error:", err);
        alert("Hubo un fallo en la descarga. Revisa la consola.");
    }
}

// 5. CONFIGURACIÓN DEL REPRODUCTOR (PLYR)
const player = new Plyr('#player');

function cerrarReproductor() {
    document.getElementById('player-container').style.display = 'none';
    player.stop();
}