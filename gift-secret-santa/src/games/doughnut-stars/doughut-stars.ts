
import { Hands } from '@mediapipe/hands';
import * as THREE from 'three';

// declare var Hands: any;
type DoughnutStarsOutProps = {
    score?: number,
    msg?: string[]
}
type DoughnutStarsProps = {
    _element: HTMLElement,
    output: (prop: DoughnutStarsOutProps) => void
}

export function DoughnutStars({
    _element,
    output
}: DoughnutStarsProps) {

    const element = _element;
    let counter = 0;

    // Setup basic scene
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(75, element.clientWidth / element.clientHeight, 0.1, 1000);
    let renderer = new THREE.WebGLRenderer();

    renderer.setSize(
        element.clientWidth,
        element.clientHeight
    );
    element.appendChild(renderer.domElement);

    // Creazione delle stelle
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });
    const starVertices: number[] = [];

    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Create a ciambella (the endless path)
    const geometry = new THREE.TorusGeometry(2, 0.5, 16, 100); // Parametri: raggio principale, raggio del tubo, segmenti radiali, segmenti del tubo
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Materiale base con colore arancione
    const torus = new THREE.Mesh(geometry, material);
    scene.add(torus);

    // Creazione del player - disco
    const diskGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 32); // Disco con raggio 1.5, altezza 0.1
    const diskMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    //const player = new THREE.Mesh(diskGeometry, diskMaterial);

    // Creazione del player - la sfera (invece del disco)
    const sphereGeometry = new THREE.SphereGeometry(1.5, 32, 32); // Sfera con raggio 1.5, 32 segmenti per la larghezza e l'altezza
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const player = new THREE.Mesh(sphereGeometry, sphereMaterial);

    player.rotation.x = Math.PI / 2; // Ruota il disco in modo che sia perpendicolare all'asse Z
    player.position.z = -10; // Posiziona il disco indietro rispetto al torus
    scene.add(player);

    camera.position.z = 5;


    // per interrompere la navigazione della ciambella
    let stop = false;
    // per evitare i conteggi doppi quando la pallina passa dentro la ciambella
    let trigger = false;
    // per resettare il centro della ciambella al reset
    let resetInitialTorus = false;
    let stepSpeed = 5;
    let speed = 5;
    output({
        score: 0,
        msg: [`Speed: ${speed}`]
    })

    // Configura la webcam
    const videoElement: any = document.getElementById('videoElement');
    const videoArea = document.getElementById('video-area');
    if (videoElement) {
        videoElement.width = videoArea.clientWidth;
        videoElement.height = videoArea.clientHeight;
    }

    async function startCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });
        videoElement.srcObject = stream;
        await videoElement.play();
    }

    // Setup MediaPipe Hands
    const hands = new Hands({
        locateFile: (file) => {
            console.log("file", file)
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });
    console.log(hands)

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    // Funzione per gestire i risultati del rilevamento delle mani
    function onResults(results) {
        // Pulisci il canvas overlay
        // ctx.clearRect(0, 0, canvasOverlay.width, canvasOverlay.height);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // Usa il punto di riferimento per il polso per ottenere la posizione della mano
            const wrist = landmarks[0];
            const x = (wrist.x - 0.5) * 20; // Trasforma la posizione da -10 a 10
            const y = (0.5 - wrist.y) * 20; // Trasforma la posizione da -10 a 10
            //console.log("old",player.position.x , player.position.y, "new", x,y)
            // Aggiorna la posizione della sfera basata sul movimento della mano
            player.position.x = -x;
            player.position.y = y;

            // ctx.strokeStyle = 'red';
            // ctx.lineWidth = 2;
            // const boundingBox = getBoundingBox(landmarks);
            // ctx.strokeRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);

        }
    }


    const printSpeed = () => {
        const element = document.querySelector('#speed');

        if (element)
            element.innerHTML = `speed is ${speed}`
    }

    const updateCounter = (count) => {
        counter = count;

        output({
            score: count,
            msg: [`Speed: ${speed}`]
        })
        return counter;
    }
    function resetTorusPosition() {
        torus.position.z = -50; // Riposiziona il torus più indietro lungo l'asse Z
        if (resetInitialTorus) {
            torus.position.x = 0;
            torus.position.y = 0;
            resetInitialTorus = false;
        } else {
            torus.position.x = (Math.random() - 0.5) * 10; // Nuova posizione casuale lungo l'asse X (-5 a 5)
            torus.position.y = (Math.random() - 0.5) * 10; // Nuova posizione casuale lungo l'asse Y (-5 a 5)
        }
    }
    function detectIntersection() {
        // Calcola la distanza tra il centro del disco e il centro del torus
        const distanceXY = Math.sqrt(
            Math.pow(player.position.x - torus.position.x, 2) +
            Math.pow(player.position.y - torus.position.y, 2)
        );

        // Parametri del torus
        const torusInnerRadius = 1.5; // Raggio interno del torus (dove il disco può passare)

        // Controllo di intersezione lungo Z e se il disco è dentro il raggio del buco del torus
        if (
            Math.abs(player.position.z - torus.position.z) < 0.1 && // Se sono abbastanza vicini lungo l'asse Z
            distanceXY < torusInnerRadius // Se il disco è all'interno del raggio interno del torus
        ) {
            console.log("Il disco è passato attraverso la ciambella!");
            if (!trigger) {
                speed = speed + stepSpeed;
                updateCounter(counter + 1);
                trigger = true;
            }
        }
    }

    function countRealSpeed() {
        return speed / 100;
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function keyDown(code: string) {
        if (code === 'KeyS') {
            stop = !stop;
            console.log("s", stop);
        } else if (code === 'KeyA') {
            speed = speed + stepSpeed;
            printSpeed();
        } else if (code === 'KeyD') {
            speed = speed - stepSpeed;
            printSpeed();
        } else if (code === 'KeyR') {
            resetInitialTorus = true;
        }

        else if (code === 'ArrowLeft') {
            player.position.x -= 1; // Move left
        } else if (code === 'ArrowRight') {
            player.position.x += 1; // Move right
        } else if (code === 'ArrowUp') {
            player.position.y += 1; // Move Up
        } else if (code === 'ArrowDown') {
            player.position.y -= 1; // Move Down
        }
    }

   
    function start() {
        startCamera()
        .then(() => {
            videoElement.classList.remove('hidden');
            const sendVideo = async () => {
                await hands.send({ image: videoElement });
                requestAnimationFrame(sendVideo);
            };
            sendVideo();
        })
        .catch((err => {
            console.error("error sgtart camera");
        }));
        animate();
    }
    function animate() {

        requestAnimationFrame(animate);
        // console.log(torus.position.z)
        //Move the floor backward to create the endless runner effect
        if (!stop) {
            torus.position.z += countRealSpeed();
        }

        // Update camera position or controls
        detectIntersection();

        if (torus.position.z > camera.position.z + 5) {
            trigger = false;
            resetTorusPosition();
        }

        // Movimento delle stelle verso la camera
        stars.position.z += 0.1;

        // Se le stelle hanno superato un certo punto, riportale indietro
        if (stars.position.z > 50) {
            stars.position.z = -50;
        }

        renderer.render(scene, camera);
    }

    function clickLeft() {
        keyDown('ArrowLeft')
    }
    function clickRight() {
        keyDown('ArrowRight')
    }
    function clickUp() {
        keyDown('ArrowUp')
    }
    function clickDown() {
        keyDown('ArrowDown')
    }


    return {
        start,
        clickLeft,
        clickRight,
        clickUp,
        clickDown
    }
}

