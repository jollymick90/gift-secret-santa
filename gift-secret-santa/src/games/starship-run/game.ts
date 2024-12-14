import * as THREE from 'three';

import { Asteroid } from './asteroid';
import { Character } from './character';
import { Colors } from './constant';
import { GameObject } from './game.model';
import { Tree } from './tree';
import { createBox } from './ui-utils';

// Start receiving feedback from the player.

const stringThanks = "We thank Wan Fung Chui for the inspiration."
const left = 37;
const up = 38;
const right = 39;
const p = 80;
const disableObstacle = false;

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
const GroundSegmentSize = 1500;
const pieceStreet = 60;
const spaceJump = 20;
const gapProbability = 0.15;


class GroundSegment implements GameObject {
	constructor(x: number, y: number, z: number) {

		this.mesh = createBox(3000, 20, GroundSegmentSize, Colors.cherry, x, y, z);
	}
	mesh: any;
	x: number;
	y: number;
	z: number;
	s: number;

	collides(charMinX: number, charMaxX: number, charMinY: number,
		charMaxY: number, charMinZ: number, charMaxZ: number) {
		// Il terreno non causa collisione distruttiva, 
		// ma ci serve sapere se il personaggio è "appoggiato" su di esso.
		// Possiamo semplicemente verificare se il personaggio si trova nel range Z del terreno 
		// e X all'interno del terreno.

		// Calcoliamo i bounding box del terreno
		let segMinX = this.mesh.position.x - (GroundSegmentSize / 2);
		let segMaxX = this.mesh.position.x + (GroundSegmentSize / 2);
		let segMinZ = this.mesh.position.z - (GroundSegmentSize / 2);
		let segMaxZ = this.mesh.position.z + (GroundSegmentSize / 2);

		// Se l'omino è all'interno del riquadro del terreno in X e Z,
		// lo consideriamo "supportato".
		if (charMaxX > segMinX && charMinX < segMaxX &&
			charMaxZ > segMinZ && charMinZ < segMaxZ) {
			// Qui potremmo mettere un flag che indica che sotto l'omino c'è terreno.
			return true;
		}

		return false;
	}
}
export class Game {

	isFallIntoGap: boolean = false;
	element: any;
	scene: any;
	camera: any;
	character: any;
	renderer: any;
	light: any;
	stars: any;
	objects: GameObject[] = [];
	grounds: GroundSegment[] = [];
	paused: boolean = false;
	keysAllowed: { [key: string]: boolean } = {};
	score: number = 0;
	difficulty: any;
	treePresenceProb: any;
	maxTreeSize: any;
	gameOver: any;
	fogDistance: number;
	holePositions: { [zPos: number]: boolean } = {};
	obstacolePosition: { [zPos: number]: boolean } = {};

	typeOfObstacole: 'ast' | 'tree' = 'ast';
	
	_output: (prop: StarshipRunOutProps) => void

	timer: number = 0;

	private onPause: () => void = () => { console.warn("noPauseDefined"); };
	private onResume: () => void = () => { console.warn("noResumeDefined"); };
	private onCollisionDetected: (prop: StarshipRunOutProps) => void = (prop: StarshipRunOutProps) => { console.warn("onCollisionDetected") }
	private onScoreChanged: (score: number) => void = (score: number) => { console.warn("onCollisionDetected") }

	constructor(prop: StarshipRunProps) {
		this.element = prop._element;
		this._output = prop.output;

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


		this.fogDistance = 40000;
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
		// (window as any).camera = this.camera;

		// // Set up resizing capabilities.
		window.addEventListener('resize', this.handleWindowResize.bind(this), false);

		// // Initialize the lights.
		this.light = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 1);
		this.scene.add(this.light);

		// // Initialize the character and add it to the scene.
		this.addPlayer(this.scene);
		this.updateStreets(0);
		this.addStarsBackground(this.scene);

		this.objects = [];
		this.treePresenceProb = 0.2;
		this.maxTreeSize = 0.5;
		this.createInitialCollisionObject()

		// The game is paused to begin with and the game is not over.
		this.gameOver = false;
		this.paused = true;

		this.keysAllowed = {};

		// Initialize the scores and difficulty.
		this.score = 0;
		this.difficulty = 0;

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
	}
	

	updateStreets(z: number) {
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

	createRowOfGround(position: number, createSegment: boolean) {
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

	setOnPause(_onPause: () => void) {
		this.onPause = _onPause;
	}

	setOnResume(_onResume: () => void) {
		this.onResume = _onResume;
	}

	setOnCollisionDetected(_onCollisionDetected: (score: StarshipRunOutProps) => void) {
		this.onCollisionDetected = _onCollisionDetected;
	}

	setOnScoreChanged(_onScoreChanged: (score: number) => void) {
		this.onScoreChanged = _onScoreChanged;
	}

	keyUp = (e: KeyboardEvent) => {
		this.keysAllowed[e.keyCode] = true;
	}

	onFocus = () => {
		this.keysAllowed = {};
	}

	init() {

		this._output({
			msg:[stringThanks]
		})
		this.loop();
	}

	moveStars() {
		// Movimento delle stelle verso la camera
		this.stars.position.z += 0.1;

		// Se le stelle hanno superato un certo punto, riportale indietro
		if (this.stars.position.z > 50) {
			this.stars.position.z = -50;
		}
	}
	/**
	  * The main animation loop.
	  */
	loop() {
		this.timer++;
		if (this.timer % 2 == 0) {
			this.renderer.render(this.scene, this.camera);
			requestAnimationFrame(this.loop.bind(this));
			return;
		}

		// Update the game.
		if (!this.paused) {
			// Add more trees and increase the difficulty.
			// const meshPositionCondition = this.objects.length > 0 && ((this.objects[this.objects.length - 1].mesh.position.z) % GroundSegmentSize === 0);
			// if (meshPositionCondition) {
			// 	this.difficulty += 1;

			// 	this.calculateFogDistance();
			// 	// Alterna il tipo di ostacolo
				
			// 	let newPos = -120000;
			// 	this.createRowOfObjects({
			// 		position: newPos,
			// 		probability: this.treePresenceProb,
			// 		minScale: 0.5,
			// 		maxScale: this.maxTreeSize
			// 	});

			// 	this.scene.fog.far = this.fogDistance;
			// }

			// Move the obstacole closer to the character.
			this.objects.forEach(function (object) {
				object.mesh.position.z += 100;
			});

			// Remove obstacole that are outside of the world.
			this.objects = this.objects.filter(function (object) {
				return object.mesh.position.z < 0;
			});

			if (this.objects.length < 20) {
				
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

			// Check for collisions between the character and objects.
			// Controlliamo collisioni e gap

			if (this.checkFallIntoGap()) {
				this.isFallIntoGap = true;
				// this.gameOver = true;
				// this.paused = true;
				this.onCollisionDetected({
					score: this.score,
					msg: ["Saresti caduto... ma sei superman"]
				});
			} else if (this.collisionsDetected()) {
				this.gameOver = true;
				this.paused = true;
				this.printInfo();
			} 
			if (!this.isFallIntoGap && this.timer % 150 === 0) {
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
	printInfo(endOfGame: boolean = true) {
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
	calculateFogDistance() {
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

	/**
	  * A method called when window is resized.
	  */
	handleWindowResize() {
		this.renderer.setSize(this.element.clientWidth, this.element.clientHeight);
		this.camera.aspect = this.element.clientWidth / this.element.clientHeight;
		this.camera.updateProjectionMatrix();
	}

	createRowOfObjects(
		prop: RowOfTreeProp
	) {
		const {
			position,
			probability,
			minScale,
			maxScale
		} = prop;
		if (disableObstacle) {
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

	createRowOfAsteroidOld(
		prop: RowOfTreeProp
	) {
		const {
			position,
			probability,
			minScale,
			maxScale
		} = prop;
		if (disableObstacle) {
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
	collisionsDetected() {
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

	checkFallIntoGap() {
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

	onKeyDown = (e: KeyboardEvent) => {
		const key = e.keyCode;
		this.handleKeyPress(key);
	}

	public clickLeft() {
		this.handleKeyPress(left);
	}
	public clickRight() {
		this.handleKeyPress(right);
	}
	public clickUp() {
		this.handleKeyPress(up);
	}

	public clickPause() {
		this.handleKeyPress(p);
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
		if (key === p) {
			this.paused = true;
			this.character.onPause();
			this.onPause();
			return;
		}
		if (key === up && !this.paused) {
			this.character.onUpKeyPressed();
			return;
		}
		if (key === left && !this.paused) {
			this.character.onLeftKeyPressed();
			return;
		}
		if (key === right && !this.paused) {
			this.character.onRightKeyPressed();
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
	createRowOfTrees(
		prop: RowOfTreeProp
	) {
		const {
			position,
			probability,
			minScale,
			maxScale
		} = prop;
		if (disableObstacle) {
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