import * as THREE from 'three';

import { StarFaceDetection } from '../../utils/face-detection';
import { Asteroid } from './asteroid';
import { Character } from './character';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  FaceControlBTN,
  gapProbability,
  GroundSegmentSize,
  KeyD,
  KeyF,
  KeyP,
  OKClicked,
  pieceStreet,
  spaceJump,
  stringThanks,
} from './constant';
import { GameObject } from './game.model';
import { GroundSegment } from './groundsegment';
import { Tree } from './tree';

type RowOfTreeProp = {
	position: number;
	probability: number;
	minScale: number;
	maxScale: number;
}

type StarshipRunOutProps = {
	score?: number,
	speed?: number,
	msg?: string[]
}
type StarshipRunProps = {
	_element: HTMLElement,
	output: (prop: StarshipRunOutProps) => void
}

type TypeOfObstacole = 'ast' | 'tree';

export class Game {


	private element: HTMLElement;
	private obstacleBtn: HTMLElement;
	private supermanmodeBtn: HTMLElement;
	private ghostBtn: HTMLElement;
	private faceControlBtn: HTMLElement;
	private scene: any;
	private camera: any;
	private character: any;
	private renderer: any;
	private light: any;
	private stars: any;

	private treePresenceProb: number = 0.2;
	private maxTreeSize: number = 0.5;
	private fogDistance: number = 40000;
	private timer: number = 0;
	private score: number = 0;
	private difficulty: number = 0;

	private paused = true;
	private isFallIntoGap = false;
	private isCollisionDetected = false;
	private gameOver = false;
	private showFace = false;
	private faceControllerEnabled = false;
	private supermanMode = true;
	private enableCollisionObject = false;
	private ghostMode = true;

	private starFaceDetection: StarFaceDetection = new StarFaceDetection();

	private keysAllowed: { [key: string]: boolean } = {};
	private holePositions: { [zPos: number]: boolean } = {};
	private obstacolePosition: { [zPos: number]: boolean } = {};
	private objects: GameObject[] = [];
	private grounds: GroundSegment[] = [];

	private typeOfObstacole: TypeOfObstacole = 'ast';

	private _output: (prop: StarshipRunOutProps) => void

	private onPause: () => void = () => { console.warn("noPauseDefined"); };
	private onResume: () => void = () => { console.warn("noResumeDefined"); };
	private onCollisionDetected: (prop: StarshipRunOutProps) => void = (prop: StarshipRunOutProps) => { console.warn("onCollisionDetected") }
	private onScoreChanged: (score: number) => void = (score: number) => { console.warn("onCollisionDetected") }
	private onFaceDetectionMode: (active: boolean) => void;

	constructor(prop: StarshipRunProps) {
		this.element = prop._element;
		this._output = prop.output;

		this.starFaceDetection.load();

		this.renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true
		});

		this.renderer.setSize(
			this.element.clientWidth,
			this.element.clientHeight
		);
		this.renderer.shadowMap.enabled = true;
		this.element.appendChild(this.renderer.domElement);
		this.scene = new THREE.Scene();

		this.scene.fog = new THREE.Fog(0xFFFFFF, 1, this.fogDistance);
		// Initialize the camera with field of view, aspect ratio,
		// near plane, and far plane.
		this.camera = new THREE.PerspectiveCamera(
			60,
			this.element.clientWidth / this.element.clientHeight,
			1,
			120000
		);
		this.camera.position.set(0, 1500, -2000);
		this.camera.lookAt(new THREE.Vector3(0, 600, -5000));

		// // Set up resizing capabilities.
		window.addEventListener('resize', this.handleWindowResize.bind(this), false);

		// // Initialize the lights.
		this.light = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 1);
		this.scene.add(this.light);

		// // Initialize the character and add it to the scene.
		this.addPlayer(this.scene);
		this.updateStreets(0);
		this.addStarsBackground(this.scene);

		// this.createInitialCollisionObject()
		this.addPrivateEventListener();
		this.updateStateBtns();

	}

	public setFaceDetectionModeActive(arg0: (active: boolean) => void) {
		this.onFaceDetectionMode = arg0;
	}
	public setOnPause(_onPause: () => void) {
		this.onPause = _onPause;
	}

	public setOnResume(_onResume: () => void) {
		this.onResume = _onResume;
	}

	public setOnCollisionDetected(_onCollisionDetected: (score: StarshipRunOutProps) => void) {
		this.onCollisionDetected = _onCollisionDetected;
	}

	public setOnScoreChanged(_onScoreChanged: (score: number) => void) {
		this.onScoreChanged = _onScoreChanged;
	}
	public clickOK() {
		this.handleKeyPress(OKClicked);
	}
	public clickLeft() {
		this.handleKeyPress(ArrowLeft);
	}
	public clickRight() {
		this.handleKeyPress(ArrowRight);
	}
	public clickUp() {
		this.handleKeyPress(ArrowUp);
	}
	public clickPause() {
		this.handleKeyPress(KeyP);
	}
	public clickF() {
		this.handleKeyPress(KeyF);
	}

	public clickFaceControlBTN() {
		this.handleKeyPress(FaceControlBTN);
	}

	public clickD() {
		this.handleKeyPress(KeyD);
	}

	public startEngine() {

		this._output({
			msg: [stringThanks]
		})
		this.loop();
	}
	/**
		 * The main animation loop.
		 */
	private loop() {
		this.timer++;
		if (this.timer % 2 == 0) {
			this.moveStars();
			this.renderer.render(this.scene, this.camera);
			requestAnimationFrame(this.loop.bind(this));
			return;
		}

		// Update the game.
		if (!this.paused) {

			// Move the obstacole closer to the character.
			this.objects.forEach(function (object) {
				object.mesh.position.z += 100;
			});

			// Remove obstacole that are outside of the world.
			this.objects = this.objects.filter(function (object) {
				return object.mesh.position.z < 0;
			});

			if (this.objects.length > 0 && this.objects.length < 20) {

				const last = this.objects[this.objects.length - 1];
				const z: number = last.mesh.position.z;
				this.createInitialCollisionObject(z);
			}

			this.grounds.forEach(function (object) {
				object.mesh.position.z += 100;
			});

			// Remove grounds that are outside of the world.
			this.grounds = this.grounds.filter(function (object) {
				return object.mesh.position.z < 0;
			});

			if (this.grounds.length < 20) {
				let last = this.grounds[this.grounds.length - 1];
				const z: number = last.mesh.position.z;

				this.updateStreets(z)
			}
			// Make the character move according to the controls.
			this.character.update();

			if (this.checkFallIntoGap()) {
				this.isFallIntoGap = true;

				if (this.supermanMode) {
					this.onCollisionDetected({
						score: this.score,
						msg: ["Saresti caduto... ma sei superman"]
					});
				} else {

					this.gameOver = true;
					this.paused = true;
					this.printInfo();

				}

			} else if (this.collisionsDetected()) {
				this.isCollisionDetected = true;

				if (this.ghostMode) {
					this.onCollisionDetected({
						score: this.score,
						msg: ["Modalità fantasma attiva... passi attraverso"]
					});
				} else {
					this.gameOver = true;
					this.paused = true;
					this.printInfo();
				}


			}
			if ((!this.isCollisionDetected || !this.isFallIntoGap) && this.timer % 150 === 0) {
				this.printInfo(false)
			}


			// Update the scores.
			this.score += 10;
			this.onScoreChanged(this.score);
		}
		this.moveStars();
		// Render the page and repeat.
		this.renderer.render(this.scene, this.camera);
		requestAnimationFrame(this.loop.bind(this));
	}

	private addPrivateEventListener() {
		document.addEventListener(
			'keydown',
			this.onKeyDown
		);
		document.addEventListener(
			'keyup',
			this.keyUp
		);
		document.addEventListener(
			'focus',
			this.onFocus
		);

		this.obstacleBtn = document.getElementById('obstacle');
		this.obstacleBtn?.addEventListener('click', () => {
			this.enableCollisionObject = !this.enableCollisionObject;

			this.updateObstacleBtnState();
		});
		this.supermanmodeBtn = document.getElementById('supermanmode');
		this.supermanmodeBtn?.addEventListener('click', () => {
			this.supermanMode = !this.supermanMode;

			this.updateSupermanBtnState();
		});
		this.ghostBtn = document.getElementById('ghost');
		this.ghostBtn?.addEventListener('click', () => {
			this.ghostMode = !this.ghostMode;

			this.updateGhostBtnState();
		});

		this.faceControlBtn = document.getElementById('FaceControlBTN');
		this.faceControlBtn?.addEventListener('click', () => {

			this.clickFaceControlBTN();
			this.updateFaceControlBtnState();
		});

		this.starFaceDetection.onController({
			right: () => {
				if (this.faceControllerEnabled)
					this.clickRight();
			},
			left: () => {
				if (this.faceControllerEnabled)
					this.clickLeft();
			},
			center: () => { },
			up: () => { },
			down: () => { }
		})
	}

	private updateStateBtns() {
		this.updateObstacleBtnState();

		this.updateSupermanBtnState();

		this.updateGhostBtnState();

		this.updateFaceControlBtnState();
	}

	private updateFaceControlBtnState() {
		if (this.faceControllerEnabled) {
			this.faceControlBtn?.classList.add('active');
			this._output({
				msg: ["hai attivato il controllo con la faccia"]
			})
		} else {
			this.faceControlBtn?.classList.remove('active');

			this._output({
				msg: ["hai disattivato il controllo con la faccia"]
			})
		}
	}

	private updateGhostBtnState() {
		if (this.ghostMode) {
			this.ghostBtn?.classList.add('active');
			this._output({
				msg: ["Ora puoi passare attraverso gli ostacoli"]
			})
		} else {
			this.ghostBtn?.classList.remove('active');
			this._output({
				msg: ["Ora devi schivare o saltare gli ostacoli"]
			})
		}
	}

	private updateSupermanBtnState() {
		if (this.supermanMode) {
			this.supermanmodeBtn?.classList.add('active');
			this._output({
				msg: ["Ora puoi volare sopra i fossi"]
			})
		} else {
			this.supermanmodeBtn?.classList.remove('active');
			this._output({
				msg: ["Ora devi saltare i fossi"]
			})
		}
	}

	private updateObstacleBtnState() {
		if (this.enableCollisionObject) {
			this.obstacleBtn?.classList.add('active');
			this._output({
				msg: ["Beh! li vedi gli ostacoli, quindi è chiaro!"]
			})
		} else {
			this.obstacleBtn?.classList.remove('active');
			this._output({
				msg: ["Puff! non ci sono più gli ostacoli"]
			})
		}
		if (this.enableCollisionObject && this.objects.length === 0) {
			this.createInitialCollisionObject();
		}

		if (!this.enableCollisionObject && this.objects.length > 0) {
			this.removeCollisionObject();
		}
	}

	private updateStreets(z: number) {
		// Numero di segmenti di strada pieni dopo un buco
		let segmentsSinceLastGap = spaceJump; // Avviamo con un valore >= spaceJump per permettere un buco iniziale

		for (let i = 0; i <= pieceStreet; i++) {
			const zPos = z - GroundSegmentSize * i; // Ad esempio, se l'ultimo segmento era a z, ora creiamo da z-3000, z-6000, ecc.

			let attemptGap = (Math.random() < gapProbability);
			let createSegment: boolean;

			if (i > spaceJump && attemptGap && segmentsSinceLastGap >= spaceJump) {
				// Possiamo creare un buco
				createSegment = false;
				segmentsSinceLastGap = 0; // Resettiamo il contatore, da ora in poi servono N segmenti pieni
			} else {
				// Creiamo strada piena
				createSegment = true;
				segmentsSinceLastGap++; // Incrementiamo i segmenti dall’ultimo buco
			}
			this.createRowOfGround(zPos, createSegment);
			this.holePositions[zPos] = !createSegment
		}
	}

	private createRowOfGround(position: number, createSegment: boolean) {
		if (!createSegment) {
			// Niente suolo qui -> dirupo
			return;
		}
		const groundSegment = new GroundSegment(0, -700, position);
		this.grounds.push(groundSegment);
		this.scene.add(groundSegment.mesh);
	}

	private addPlayer(scene: any) {
		this.character = new Character();
		this.character.init();
		scene.add(this.character.element);
	}

	private addStarsBackground(scene: any) {
		const starGeometry = new THREE.BufferGeometry();
		const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 5 });
		const starVertices: number[] = [];

		for (let i = 0; i < 10000; i++) {
			const x = (Math.random() - 0.5) * 200000;
			const y = (Math.random() - 0.5) * 200000;
			const z = (Math.random() - 0.5) * 200000;
			starVertices.push(x, y, z);
		}

		starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
		this.stars = new THREE.Points(starGeometry, starMaterial);
		scene.add(this.stars);
	}

	private keyUp = (e: KeyboardEvent) => {
		this.keysAllowed[e.keyCode] = true;
	}

	private onFocus = () => {
		this.keysAllowed = {};
	}

	private moveStars() {
		// Movimento delle stelle verso la camera
		this.stars.position.z += 100;

		// Se le stelle hanno superato un certo punto, riportale indietro
		if (this.stars.position.z > 50) {
			this.stars.position.z = -50;
		}
	}

	private printInfo(endOfGame: boolean = true) {
		const textOutput = endOfGame ? "Game over!" : "";
		let rankNames = ["Typical Engineer", "Couch Potato", "Weekend Jogger", "Daily Runner",
			"Local Prospect", "Regional Star", "National Champ", "Second Mo Farah"];
		let rankIndex = Math.floor(this.score / 15000);
		let nextRankRow = "";
		// If applicable, display the next achievable rank.
		if (this.score < 124000) {

			nextRankRow = (rankIndex <= 5)
				? "".concat((rankIndex + 1) * 15 + "", "k-", (rankIndex + 2) * 15 + "", "k")
				: (rankIndex == 6)
					? "105k-124k"
					: "124k+";
			nextRankRow = nextRankRow + " *Score within this range to earn the next rank*";
		}

		// Display the achieved rank.
		let achievedRankRow = (rankIndex <= 6)
			? "".concat(rankIndex * 15 + "", "k-", (rankIndex + 1) * 15 + "", "k")
			: (this.score < 124000)
				? "105k-124k"
				: "124k+";
		let achievedRankRow2 = (rankIndex <= 6)
			? "Congrats! You're a ".concat(rankNames[rankIndex], "!")
			: (this.score < 124000)
				? "Congrats! You're a ".concat(rankNames[7], "!")
				: "Congrats! You exceeded the creator's high score of 123790 and beat the game!";
		achievedRankRow = achievedRankRow + " " + achievedRankRow2
		// Display all ranks lower than the achieved rank.
		if (this.score >= 120000) {
			rankIndex = 7;
		}
		var msgTotal = "";
		for (var i = 0; i < rankIndex; i++) {

			msgTotal = msgTotal + " " + "".concat(i * 15 + "", "k-", (i + 1) * 15 + "", "k");
			msgTotal = msgTotal + " " + rankNames[i];
		}
		if (this.score > 124000) {
			msgTotal = msgTotal + " " + "105k-124k";
			msgTotal = msgTotal + " " + rankNames[7];
		}
		this.onCollisionDetected({
			score: this.score / 15000,
			msg: [
				textOutput,
				achievedRankRow,
				msgTotal
			] as string[]

		});
	}
	private calculateFogDistance() {
		const levelLength = 30;
		if (this.difficulty % levelLength == 0) {
			const level = this.difficulty / levelLength;
			switch (level) {
				case 1:
					this.treePresenceProb = 0.35;
					this.maxTreeSize = 0.5;
					break;
				case 2:
					this.treePresenceProb = 0.35;
					this.maxTreeSize = 0.85;
					break;
				case 3:
					this.treePresenceProb = 0.5;
					this.maxTreeSize = 0.85;
					break;
				case 4:
					this.treePresenceProb = 0.5;
					this.maxTreeSize = 1.1;
					break;
				case 5:
					this.treePresenceProb = 0.5;
					this.maxTreeSize = 1.1;
					break;
				case 6:
					this.treePresenceProb = 0.55;
					this.maxTreeSize = 1.1;
					break;
				default:
					this.treePresenceProb = 0.55;
					this.maxTreeSize = 1.15;
			}
		}
		if ((this.difficulty >= 5 * levelLength && this.difficulty < 6 * levelLength)) {
			this.fogDistance -= (25000 / levelLength);
		} else if (this.difficulty >= 8 * levelLength && this.difficulty < 9 * levelLength) {
			this.fogDistance -= (5000 / levelLength);
		}
	}
	private createInitialCollisionObject(z: number = 0) {
		for (let i = 0; i < 60; i++) {
			const zPos = z - i * 3000; // Il primo sarà a 0, poi -3000, -6000, ecc.
			this.createRowOfObjects({
				position: zPos,
				probability: this.treePresenceProb,
				minScale: 0.5,
				maxScale: this.maxTreeSize
			});
		}
	}

	private removeCollisionObject() {
		for (const obj of this.objects) {
			this.scene.remove(obj.mesh);
		}

		this.objects = [];
	}

	/**
	  * A method called when window is resized.
	  */
	private handleWindowResize() {
		this.renderer.setSize(this.element.clientWidth, this.element.clientHeight);
		this.camera.aspect = this.element.clientWidth / this.element.clientHeight;
		this.camera.updateProjectionMatrix();
	}

	private createRowOfObjects(
		prop: RowOfTreeProp
	) {
		const {
			position,
			probability,
			minScale,
			maxScale
		} = prop;
		if (!this.enableCollisionObject) {
			return;
		}
		if (this.typeOfObstacole === 'tree') {
			this.typeOfObstacole = 'ast';
		} else {
			this.typeOfObstacole = 'tree';
		}
		let laneObj = 0;
		for (let lane = -1; lane < 2; lane++) {
			const randomNumber = Math.random();
			if (randomNumber < probability) {
				if (this.score < 62000 && laneObj > 0) {
					continue;
				}

				if (this.score > 62000 && this.score < 124000 && laneObj > 1) {
					continue;
				}
				const scale = minScale + (maxScale - minScale) * Math.random();

				laneObj++;

				let obj;
				if (this.typeOfObstacole === 'tree') {
					obj = new Asteroid(lane * 800, 0, position, scale);
				} else {
					obj = new Tree(lane * 800, -400, position, scale);
				}

				this.objects.push(obj);
				this.scene.add(obj.mesh);
				this.obstacolePosition[position] = true;
			}
		}
	}

	private createRowOfAsteroidOld(
		prop: RowOfTreeProp
	) {
		const {
			position,
			probability,
			minScale,
			maxScale
		} = prop;
		if (!this.enableCollisionObject) {
			return;
		}

		for (let lane = -1; lane < 2; lane++) {
			const randomNumber = Math.random();
			if (randomNumber < probability) {
				const scale = minScale + (maxScale - minScale) * Math.random();
				// const tree = new Asteroid(lane * 800, -400, position, scale);
				//const asteroidY = 200; 
				const tree = new Asteroid(lane * 800, 0, position, scale);

				this.objects.push(tree);
				this.scene.add(tree.mesh);
				this.obstacolePosition[position] = true;
			}
		}
	}

	/**
	 * Returns true if and only if the character is currently colliding with
	 * an object on the map.
	 */
	private collisionsDetected() {
		const charMinX = this.character.element.position.x - 115;
		const charMaxX = this.character.element.position.x + 115;
		const charMinY = this.character.element.position.y - 310;
		const charMaxY = this.character.element.position.y + 320;
		const charMinZ = this.character.element.position.z - 40;
		const charMaxZ = this.character.element.position.z + 40;
		for (let i = 0; i < this.objects.length; i++) {
			if (this.objects[i].collides(charMinX, charMaxX, charMinY,
				charMaxY, charMinZ, charMaxZ)) {
				return true;
			}
		}
		return false;
	}

	private checkFallIntoGap() {
		// Logica:
		// 1. Calcola bounding box del personaggio
		const charMinX = this.character.element.position.x - 115;
		const charMaxX = this.character.element.position.x + 115;
		const charMinY = this.character.element.position.y - 310;
		const charMaxY = this.character.element.position.y + 320;
		const charMinZ = this.character.element.position.z - 40;
		const charMaxZ = this.character.element.position.z + 40;

		// 2. Controlla se c'è almeno un segmento di terreno sotto i piedi
		// Se non c'è alcun segmento di terreno che "collida" con il personaggio da sotto,
		// significa che siamo in un gap
		let isOnGround = false;
		for (let i = 0; i < this.grounds.length; i++) {
			const obj = this.grounds[i];
			if (obj.collides(charMinX, charMaxX, charMinY, charMaxY, charMinZ, charMaxZ)) {
				isOnGround = true;
				break;
			}
		}

		// 3. Se non è a terra, controlliamo se sta saltando abbastanza in alto.
		// Se il personaggio è sotto un certo Y (diciamo < -200 se non sta saltando alto), allora cade.
		// Puoi aggiustare la logica in base all'implementazione del salto del tuo Character.
		if (!isOnGround && this.character.element.position.y <= 400) {
			// Personaggio è "caduto" nel vuoto
			return true;
		} else if (!isOnGround && this.character.element.position.y > 400) {
			this.onCollisionDetected({
				score: this.score,
				msg: ["Bravo hai saltato giusto"]
			});
		}

		return false;
	}

	private onKeyDown = (e: KeyboardEvent) => {
		const key = e.keyCode;
		this.handleKeyPress(key);
	}

	private handleKeyPress(key: number) {
		if (this.gameOver) {
			return;
		}
		if (this.paused && !this.collisionsDetected() && key > 18) {
			this.paused = false;
			this.character.onUnpause();
			this.onResume();
			return;
		}
		if (key === KeyP) {
			this.paused = true;
			this.character.onPause();
			this.onPause();
			return;
		}
		if (key === ArrowUp && !this.paused) {
			this.character.onUpKeyPressed();
			return;
		}
		if (key === ArrowLeft && !this.paused) {
			this.character.onLeftKeyPressed();
			return;
		}
		if (key === ArrowRight && !this.paused) {
			this.character.onRightKeyPressed();
			return;
		}
		if (key === KeyF) {

			this.showFace = !this.showFace;
			this.starFaceDetection.updateShowFace(this.showFace);
			return;
		}

		if (key === FaceControlBTN) {
			this.faceControllerEnabled = !this.faceControllerEnabled;
			this.onFaceDetectionMode(this.faceControllerEnabled);
			return;
		}
	}

	/**
	 * Creates and returns a row of trees according to the specifications.
	 *
	 * @param {number} POSITION The z-position of the row of trees.
	   * @param {number} PROBABILITY The probability that a given lane in the row
	   *                             has a tree.
	   * @param {number} MINSCALE The minimum size of the trees. The trees have a 
	   *							uniformly distributed size from minScale to maxScale.
	   * @param {number} MAXSCALE The maximum size of the trees.
	   *
	 */
	private createRowOfTrees(
		prop: RowOfTreeProp
	) {
		const {
			position,
			probability,
			minScale,
			maxScale
		} = prop;
		if (!this.enableCollisionObject) {
			return;
		}
		for (let lane = -1; lane < 2; lane++) {
			const randomNumber = Math.random();
			if (randomNumber < probability) {
				const scale = minScale + (maxScale - minScale) * Math.random();
				const tree = new Tree(lane * 800, -400, position, scale);
				this.objects.push(tree);
				this.scene.add(tree.mesh);
			}
		}
	}
}