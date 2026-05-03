// 1. REGISTRO DEL SERVICE WORKER
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('✅ SW registrado en:', reg.scope))
            .catch(err => console.error('❌ Error al registrar SW:', err));
    });
}

// 2. CONFIGURACIÓN DE APIS Y DB
const COBALT_API = "https://cobalt-api-production-2724.up.railway.app/api/json";
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

// 3. FUNCIONES DE INTERFAZ
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
async function procesarDescarga(id, urlVideo) {
    try {
        const response = await fetch(COBALT_API, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ url: urlVideo, vQuality: "720" })
        });

        const data = await response.json();
        if (!data.url) throw new Error("No se obtuvo URL");

        const videoRes = await fetch(data.url);
        const videoBlob = await videoRes.blob();

        // Selector de archivos para la SD
        const handle = await window.showSaveFilePicker({
            suggestedName: `video_${id}.mp4`,
            types: [{ description: 'Video MP4', accept: {'video/mp4': ['.mp4']} }]
        });

        const writable = await handle.createWritable();
        await writable.write(videoBlob);
        await writable.close();

        const tx = db.transaction(["videos"], "readwrite");
        const store = tx.objectStore("videos");
        store.get(id).onsuccess = (e) => {
            const videoData = e.target.result;
            videoData.estado = "descargado";
            store.put(videoData);
        };
        tx.oncomplete = renderizarLista;
        alert("¡Guardado en la SD!");
    } catch (err) {
        console.error(err);
        alert("Error al descargar. Asegúrate de estar usando Chrome/Edge.");
    }
}

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
