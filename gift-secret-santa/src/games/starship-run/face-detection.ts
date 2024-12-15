import * as faceapi from 'face-api.js';

export type FaceDetectionProp = {
    videoElement: HTMLVideoElement;
    videoArea: HTMLElement
}
export class StarFaceDetection {
    videoElement: HTMLVideoElement;
    videoArea: HTMLElement;

    constructor() {
        this.videoElement = document.getElementById('videoElement') as HTMLVideoElement;
        this.videoArea = document.getElementById('video-area');

        if (this.videoElement) {
            this.videoElement.width = this.videoArea.clientWidth;
            this.videoElement.height = this.videoArea.clientHeight;
        }
    }

    async startCamera() {
        console.log("start")
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });
        this.videoElement.srcObject = stream;
        await this.videoElement.play();
    }

    load() {
        const url = window.location.href + '/models';
        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(url),
            faceapi.nets.faceLandmark68Net.loadFromUri(url),
            faceapi.nets.faceRecognitionNet.loadFromUri(url),
            faceapi.nets.faceExpressionNet.loadFromUri(url)
        ]).then(this.startCamera.bind(this))
            .then(() => {
                this.detectMovement();
            })
            .catch((err) => console.error(err))
    }
    defaultDetectionFace() {
        console.log("play")
        const canvas = faceapi.createCanvasFromMedia(this.videoElement);
        canvas.classList.add('canvas-identity');
        this.videoArea.append(canvas);
        const displaySize = { width: this.videoElement.width, height: this.videoElement.height }
        faceapi.matchDimensions(canvas, displaySize)


        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(this.videoElement, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
            const resizedDetections = faceapi.resizeResults(detections, displaySize)
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
            faceapi.draw.drawDetections(canvas, resizedDetections)
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
            faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
        }, 100)
    }
    detectMovement() {
        let lastCenterX: number | null = null;
        let lastCenterY: number | null = null;
        console.log("play")
        const canvas = faceapi.createCanvasFromMedia(this.videoElement);
        canvas.classList.add('canvas-identity');
        this.videoArea.append(canvas);
        const displaySize = { width: this.videoElement.width, height: this.videoElement.height }
        faceapi.matchDimensions(canvas, displaySize)
        const canvasCtx = canvas.getContext('2d');

        // Definiamo il centro orizzontale come riferimento
        const centerLineX = displaySize.width / 2;
        // Definiamo un threshold: ad esempio se ci si sposta di più di 50px a destra o sinistra dal centro
        const horizontalThreshold = 50;

        // Stessa logica per l’asse verticale (per centro, alto, basso), se necessario.
        const centerLineY = displaySize.height / 2;
        const verticalThreshold = 50;

        setInterval(async () => {
            const detections = await faceapi
                .detectAllFaces(this.videoElement, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            // const canvasCtx = canvas.getContext('2d');
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            canvasCtx.save();
            canvasCtx.translate(canvas.width, 0);
            canvasCtx.scale(-1, 1);
            // faceapi.draw.drawDetections(canvas, resizedDetections);
            // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            // faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
            canvasCtx.restore();

            // ({ lastCenterX, lastCenterY } = this.centerLeftRightUpDown(resizedDetections, centerLineX, centerLineY, horizontalThreshold, verticalThreshold, lastCenterX, lastCenterY));
            // Supponiamo che stiamo rilevando solo un volto.
            ({ lastCenterX, lastCenterY } = this.leftRightUpDown(resizedDetections, lastCenterX, lastCenterY));

        }, 100);

    }

    private leftRightUpDown(resizedDetections: faceapi.WithFaceExpressions<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection; }, faceapi.FaceLandmarks68>>[], lastCenterX: number, lastCenterY: number) {
        if (resizedDetections.length > 0) {
            const detection = resizedDetections[0].detection;
            const box = detection.box;
            const centerX = box.x + box.width / 2;
            const centerY = box.y + box.height / 2;

            // Se abbiamo una precedente posizione, confrontiamola
            if (lastCenterX !== null && lastCenterY !== null) {
                const deltaX = centerX - lastCenterX;
                const deltaY = centerY - lastCenterY;

                // Definiamo una soglia per il movimento, es: 5 px
                const threshold = 5;

                if (Math.abs(deltaX) > Math.abs(deltaY)) {

                    if (deltaX > threshold) {
                        console.log("sinistra");
                    } else if (deltaX < -threshold) {
                        console.log("destra");
                    }
                } else {
                    // Movimento verticale dominante
                    if (deltaY > threshold) {
                        console.log("basso");
                    } else if (deltaY < -threshold) {
                        console.log("alto");
                    }
                }
            }

            // Aggiorniamo i valori precedenti
            lastCenterX = centerX;
            lastCenterY = centerY;
        }
        return { lastCenterX, lastCenterY };
    }

    private centerLeftRightUpDown(resizedDetections: faceapi.WithFaceExpressions<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection; }, faceapi.FaceLandmarks68>>[], centerLineX: number, centerLineY: number, horizontalThreshold: number, verticalThreshold: number, lastCenterX: number, lastCenterY: number) {
        if (resizedDetections.length > 0) {
            const detection = resizedDetections[0].detection;
            const box = detection.box;
            const centerX = box.x + box.width / 2;
            const centerY = box.y + box.height / 2;

            // Ora invece di confrontare con la posizione passata, confrontiamo col centro fisso
            const diffX = centerX - centerLineX;
            const diffY = centerY - centerLineY;

            // Determiniamo se siamo a sinistra, centro o destra
            let horizontalPosition: string;
            if (Math.abs(diffX) < horizontalThreshold) {
                horizontalPosition = "centro";
            } else if (diffX > 0) {
                // Ricorda che abbiamo specchiato il canvas, quindi se diffX > 0 significa che
                // il volto si trova a sinistra dell'immagine specchiata (da controllare la logica in base a come vuoi interpretare sinistra/destra)
                horizontalPosition = "sinistra";
            } else {
                horizontalPosition = "destra";
            }

            // Stessa cosa per l’asse verticale
            let verticalPosition: string;
            if (Math.abs(diffY) < verticalThreshold) {
                verticalPosition = "centro";
            } else if (diffY > 0) {
                verticalPosition = "basso";
            } else {
                verticalPosition = "alto";
            }

            console.log(`Orizzontale: ${horizontalPosition}, Verticale: ${verticalPosition}`);

            lastCenterX = centerX;
            lastCenterY = centerY;
        }
        return { lastCenterX, lastCenterY };
    }
}


