import * as faceapi from 'face-api.js';

export type FaceDetectionProp = {
    videoElement: HTMLVideoElement;
    videoArea: HTMLElement
}
export class StarFaceDetection {

    videoElement: HTMLVideoElement;
    videoArea: HTMLElement;
    showFace: boolean = false;
    constructor() {
        this.videoElement = document.getElementById('videoElement') as HTMLVideoElement;
        this.videoArea = document.getElementById('video-area');

        if (this.videoElement) {
            this.videoElement.width = this.videoArea.clientWidth;
            this.videoElement.height = this.videoArea.clientHeight;
        }
    }

    public updateShowFace(showFace: boolean) {
        this.showFace = showFace;
        console.log("show face", this.showFace)
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

            const lineX = this.drawTwoVerticalLine(canvas, canvasCtx);
            // this.drawCenterLine(canvasCtx, centerLineX, displaySize);
            if (this.showFace) {
                faceapi.draw.drawDetections(canvas, resizedDetections);
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
                faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
            }


            // ({ lastCenterX, lastCenterY } = this.centerLeftRightUpDown(resizedDetections, centerLineX, centerLineY, horizontalThreshold, verticalThreshold, lastCenterX, lastCenterY));
            // Supponiamo che stiamo rilevando solo un volto.
            // ({ lastCenterX, lastCenterY } = this.leftRightUpDown(resizedDetections, lastCenterX, lastCenterY));

            // Calcoliamo la posizione della faccia rispetto alla linea
            // Assumendo un solo volto rilevato, prendiamo il primo
            ({ lastCenterX, lastCenterY } = this.leftRightRedLine(lineX, canvasCtx, resizedDetections, lastCenterX, lastCenterY, centerLineX, horizontalThreshold, 60));

            canvasCtx.restore();


        }, 100);

    }
    /**
     * 
     * @param canvas 
     * @param canvasCtx 
     */
    private drawTwoVerticalLine(canvas: HTMLCanvasElement, canvasCtx: CanvasRenderingContext2D):
     { line1X: number, line2X: number} {

        // Calcoliamo le posizioni delle linee divisorie in base al mirroring.
        // Se vogliamo una divisione in tre parti da sinistra a destra, 
        // dopo il mirroring dobbiamo invertire la logica delle coordinate:

        const line1X = 2 * canvas.width / 3; // apparirà a 1/3 da sinistra, visivamente
        const line2X = canvas.width / 3; // apparirà a 2/3 da sinistra, visivamente


        // Disegniamo le linee
        canvasCtx.beginPath();
        canvasCtx.moveTo(line1X, 0);
        canvasCtx.lineTo(line1X, canvas.height);
        canvasCtx.moveTo(line2X, 0);
        canvasCtx.lineTo(line2X, canvas.height);
        canvasCtx.strokeStyle = 'red';
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();

        return {
            line1X,
            line2X
        }
    }

    private leftRightRedLine(
        lineX: { line1X: number, line2X: number},
        canvasCtx: CanvasRenderingContext2D,
        resizedDetections: faceapi.WithFaceExpressions<
            faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection; },
                faceapi.FaceLandmarks68>
        >[],
        lastCenterX: number,
        lastCenterY: number,
        centerLineX: number,
        horizontalThreshold: number,
        percentageThreshold: number
    ) {
            const {line1X, line2X} = lineX;
        if (resizedDetections.length > 0) {
            const face = resizedDetections[0];
            const box = face.detection.box;
            const faceCenterX = box.x + box.width / 2;
            const faceCenterY = box.y + box.height / 2;

            // Definiamo dimensioni del quadrato, ad esempio 100x100 px
            const rectSize = 100;
            const rectX = faceCenterX - rectSize / 2;
            const rectY = faceCenterY - rectSize / 2;

            // Disegniamo il quadrato centrato sulla faccia
            canvasCtx.strokeStyle = "red";
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeRect(rectX, rectY, rectSize, rectSize);

            // Aggiorna i lastCenterX/Y
            lastCenterX = faceCenterX;
            lastCenterY = faceCenterY;

            // Calcolo sovrapposizione con le tre zone
        // Zone:
        // Sinistra: [0, line1X]
        // Centro:   [line1X, line2X]
        // Destra:   [line2X, canvas.width]

        const rectStart = rectX;
        const rectEnd = rectX + rectSize;

        function overlap(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
            return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
        }

        const overlapLeft = overlap(rectStart, rectEnd, 0, line1X);
        const overlapCenter = overlap(rectStart, rectEnd, line1X, line2X);
        const overlapRight = overlap(rectStart, rectEnd, line2X, canvasCtx.canvas.width);

        const ratioLeft = (overlapLeft / rectSize) * 100;
        const ratioCenter = (overlapCenter / rectSize) * 100;
        const ratioRight = (overlapRight / rectSize) * 100;
        console.log(ratioLeft,
            ratioCenter,
            ratioRight)
        // Controllo se c'è una zona che supera la soglia di copertura
        if (ratioLeft >= percentageThreshold) {
            console.log("La faccia è prevalentemente nella zona SINISTRA.", ratioLeft);
        } else if (ratioRight >= percentageThreshold) {
            console.log("La faccia è prevalentemente nella zona DESTRA.", ratioRight);
        } else if (ratioCenter >= percentageThreshold) {
            console.log("La faccia è prevalentemente nella zona CENTRALE.", ratioCenter);
        } else {
            // Nessuna zona supera la soglia, la faccia è "mista" tra zone.
            // Puoi decidere come gestire questo caso.
            console.log("La faccia non è chiaramente in una singola zona con la soglia richiesta.");
        }
        } else {
            console.log("Nessun volto rilevato.");
        }
        return { lastCenterX, lastCenterY };
    }

    /**
     *         // Disegno la linea centrale come "meta"
        // Nota: poiché abbiamo fatto il flip (scale(-1, 1)), quando disegnamo
        // la linea, dobbiamo considerare questo effetto. In questo caso vogliamo
        // la linea al centro reale della canvas, quindi il centro resta lo stesso.
     * @param canvasCtx 
     * @param centerLineX 
     * @param displaySize 
     */
    private drawCenterLine(canvasCtx: CanvasRenderingContext2D, centerLineX: number, displaySize: { width: number; height: number; }) {
        canvasCtx.beginPath();
        // Invertendo l'asse X, il centro resta lo stesso se consideriamo che la scala
        // è orizzontale. Possiamo disegnare la linea al centro con:
        const lineX = centerLineX;
        canvasCtx.moveTo(lineX, 0);
        canvasCtx.lineTo(lineX, displaySize.height);
        canvasCtx.strokeStyle = "#FF0000";
        canvasCtx.lineWidth = 2;
        canvasCtx.stroke();


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


