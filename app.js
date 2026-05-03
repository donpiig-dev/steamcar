// 1. REGISTRO DEL SERVICE WORKER
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('✅ SW registrado en:', reg.scope))
            .catch(err => console.error('❌ Error al registrar SW:', err));
    });
}

// 2. CONFIGURACIÓN DE APIS Y DB
const COBALT_API = "https://cobalt-api-production-2724.up.railway.app";
let db;

const request = indexedDB.open("VaultStreamDB", 1);
request.onupgradeneeded = (e) => {
    db = e.target.result;
    db.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
};
request.onsuccess = (e) => {
    db = e.target.result;
    renderizarLista();
};

// Antes: async function agregarALista() { ... }
window.agregarALista = async function() {
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
};

function renderizarLista() {
    const listElement = document.getElementById('videoList');
    if (!listElement) return;
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
                </div>`;
        });
    };
}

// 4. LÓGICA DE DESCARGA A SD
window.procesarDescarga = async function(id, urlVideo) {
    try {
      const response = await fetch(COBALT_API, {
    method: "POST",
    mode: "cors", // Forzamos el modo CORS explícitamente
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    // body: JSON.stringify({
    //     url: urlVideo,
    //     videoQuality: "720", // Usar el nombre completo es más seguro en V10
    //     filenameStyle: "basic"
    // })
          body: JSON.stringify({
    url: urlVideo,
    videoQuality: "720",
    youtubeVideoCodec: "h264" // Esto hace que YouTube entregue el video más fácil
})
});
        const data = await response.json();
        
        // Verificamos qué nos devolvió la API en la consola para estar seguros
        console.log("Respuesta de la API:", data);

        // Si la API devuelve un estado de error
        if (data.status === 'error' || (!data.url && data.status !== 'redirect')) {
            throw new Error(data.text || "La API no devolvió un enlace válido.");
        }

        const downloadUrl = data.url;
        const videoRes = await fetch(downloadUrl);
        const videoBlob = await videoRes.blob();

        const handle = await window.showSaveFilePicker({
            suggestedName: `video_${id}.mp4`,
            types: [{
                description: 'Video MP4',
                accept: {'video/mp4': ['.mp4']}
            }]
        });

        const writable = await handle.createWritable();
        await writable.write(videoBlob);
        await writable.close();

        // Actualizar estado en la base de datos
        const tx = db.transaction(["videos"], "readwrite");
        const store = tx.objectStore("videos");
        store.get(id).onsuccess = (e) => {
            const videoData = e.target.result;
            if (videoData) {
                videoData.estado = "descargado";
                store.put(videoData);
            }
        };
        tx.oncomplete = renderizarLista;
        alert("¡Guardado exitosamente en la SD!");

    } catch (err) {
        console.error("Error detallado:", err);
        alert("Error: " + err.message);
    }
};
// Variable global para el reproductor
let player;

window.addEventListener('load', () => {
    try {
        if (typeof Plyr !== 'undefined') {
            player = new Plyr('#player');
            console.log("✅ Plyr inicializado correctamente");
        } else {
            console.error("❌ Plyr no se encontró en el objeto window");
        }
    } catch (error) {
        console.error("❌ Error al inicializar Plyr:", error);
    }
});

window.cerrarReproductor = function() {
    const container = document.getElementById('player-container');
    if (container) container.style.display = 'none';
    if (player) player.stop();
};
