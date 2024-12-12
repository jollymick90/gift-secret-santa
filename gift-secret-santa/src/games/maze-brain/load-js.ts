// Carica Box2D
export function loadBox2D(callback) {
    const script = document.createElement('script');
    script.src = window.location.href + '/assets/js/Box2dWeb.min.js'; // Percorso del file Box2D.js
    script.onload = callback;
    document.head.appendChild(script);
}

// Rimuovi Box2D
function unloadBox2D() {
    // Trova il tag script che carica Box2D e rimuovilo
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
        if (script.src.includes('/assets/js/Box2dWeb.min.js')) {
            document.head.removeChild(script);
        }
    });

    // Cancella tutte le variabili globali di Box2D
    for (const key in window) {
        if (key.startsWith('Box2D')) {
            delete window[key];
        }
    }
}


export function test() {

    // Esempio di utilizzo
    loadBox2D(() => {
        console.log('Box2D caricato');
        // Qui puoi usare Box2D
        //@ts-ignore
        (Box2D = {})
        unloadBox2D();
        console.log('Box2D scaricato');
    });
}