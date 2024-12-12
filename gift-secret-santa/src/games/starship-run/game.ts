import * as THREE from 'three';

import { Asteroid } from './asteroid';
import { Character } from './character';
import { Colors } from './constant';
import { GameObject } from './game.model';
import { Tree } from './tree';
import { createBox } from './ui-utils';

// Start receiving feedback from the player.
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
export class Game {

	element: any;
	scene: any;
	camera: any;
	character: any;
	renderer: any;
	light: any;
	stars: any;
	objects: GameObject[] = [];
	paused: boolean = false;
	keysAllowed: { [key: string]: boolean } = {};
	score: any;
	difficulty: any;
	treePresenceProb: any;
	maxTreeSize: any;
	gameOver: any;
	fogDistance: number;
	_output: (prop: StarshipRunOutProps) => void

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
		this.light = new THREE.HemisphereLight(0xFFFFFF,0xFFFFFF, 1);
		this.scene.add(this.light);

		// // Initialize the character and add it to the scene.
		this.addPlayer(this.scene);
		this.addStreet(this.scene);
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
	addStreet(scene: any) {
		let ground = createBox(3000, 20, 120000, Colors.cherry, 0, -400, -60000);
		scene.add(ground);
	}

	addPlayer(scene: any) {
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
		console.log("keyUp",e.keyCode)
		this.keysAllowed[e.keyCode] = true;
	}

	onFocus = () => {
		console.log("onFocus")
		this.keysAllowed = {};
	}

	init() {
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
		// Update the game.
		if (!this.paused) {
			// Add more trees and increase the difficulty.
			const meshPositionCondition = this.objects.length > 0 && ((this.objects[this.objects.length - 1].mesh.position.z) % 3000 === 0);
			if (meshPositionCondition) {
				this.difficulty += 1;
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
							this.maxTreeSize = 1.25;
					}
				}
				if ((this.difficulty >= 5 * levelLength && this.difficulty < 6 * levelLength)) {
					this.fogDistance -= (25000 / levelLength);
				} else if (this.difficulty >= 8 * levelLength && this.difficulty < 9 * levelLength) {
					this.fogDistance -= (5000 / levelLength);
				}
				this.createRowOfAsteroid({
					position: -120000, 
					probability: this.treePresenceProb, 
					minScale: 0.5, 
					maxScale: this.maxTreeSize
				});
				this.scene.fog.far = this.fogDistance;
			}

			// Move the trees closer to the character.
			this.objects.forEach(function (object) {
				object.mesh.position.z += 100;
			});

			// Remove trees that are outside of the world.
			this.objects = this.objects.filter(function (object) {
				return object.mesh.position.z < 0;
			});

			// Make the character move according to the controls.
			this.character.update();

			// Check for collisions between the character and objects.
			if (this.collisionsDetected()) {
				this.gameOver = true;
				this.paused = true;
				const textOutput = "Game over!";
    			let rankNames = ["Typical Engineer", "Couch Potato", "Weekend Jogger", "Daily Runner",
    				"Local Prospect", "Regional Star", "National Champ", "Second Mo Farah"];
					let rankIndex = Math.floor(this.score / 15000);
					let nextRankRow = "";
					// If applicable, display the next achievable rank.
				if (this.score < 124000) {
					
					nextRankRow = (rankIndex <= 5)
						? "".concat((rankIndex + 1) * 15 + "", "k-", (rankIndex + 2) * 15+ "", "k")
						: (rankIndex == 6)
							? "105k-124k"
							: "124k+";
					nextRankRow = nextRankRow +  " *Score within this range to earn the next rank*";
				}

				// Display the achieved rank.
				var achievedRankRow = "";
				achievedRankRow = (rankIndex <= 6)
					? "".concat(rankIndex * 15+ "", "k-", (rankIndex + 1) * 15+ "", "k").bold()
					: (this.score < 124000)
						? "105k-124k".bold()
						: "124k+".bold();
				var achievedRankRow2 = (rankIndex <= 6)
					? "Congrats! You're a ".concat(rankNames[rankIndex], "!").bold()
					: (this.score < 124000)
						? "Congrats! You're a ".concat(rankNames[7], "!").bold()
						: "Congrats! You exceeded the creator's high score of 123790 and beat the game!".bold();
				achievedRankRow = achievedRankRow + " " +  achievedRankRow2
    			// Display all ranks lower than the achieved rank.
    			if (this.score >= 120000) {
    				rankIndex = 7;
    			}
				var msgTotal = "";
    			for (var i = 0; i < rankIndex; i++) {
    				
    				msgTotal = msgTotal + " " + "".concat(i * 15+ "", "k-", (i + 1) * 15+ "", "k");
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

			// Update the scores.
			this.score += 10;
			this.onScoreChanged(this.score);
		}
		this.moveStars();
		// Render the page and repeat.
		this.renderer.render(this.scene, this.camera);
		requestAnimationFrame(this.loop.bind(this));
	}

	private createInitialCollisionObject() {
		for (let i = 10; i < 40; i++) {
			this.createRowOfAsteroid({
				position: i * -3000,
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

	createRowOfAsteroid(	
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

	onKeyDown = (e: KeyboardEvent) => {
		console.log("onKeyDownPressed",e)
		const key = e.keyCode;
		this.handleKeyPress(key);
	}

	public clickLeft() {
		console.log("clickLeft")
		this.handleKeyPress(left);
	}
	public clickRight() {
		console.log("clickRight")

		this.handleKeyPress(right);
	}

	handleKeyPress(key: number) {
		console.log("key", key)
		if (this.gameOver) {
			return;
		}
		// if (this.keysAllowed[key] === false) return;
		// this.keysAllowed[key] = false;
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

}