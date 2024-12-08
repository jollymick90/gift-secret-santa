import * as THREE from 'three';
import { Character } from './character';
import { Colors } from './constant';
import { Tree } from './tree';
import { createBox } from './ui-utils';
import { GameObject } from './game.model';
import { Asteroid } from './asteroid';

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
export class Game {

	element: any;
	scene: any;
	camera: any;
	character: any;
	renderer: any;
	light: any;
	objects: GameObject[] = [];
	paused: boolean = false;
	keysAllowed: { [key: string]: boolean } = {};
	score: any;
	difficulty: any;
	treePresenceProb: any;
	maxTreeSize: any;
	gameOver: any;
	fogDistance: number;

	private onPause: () => void = () => { console.warn("noPauseDefined"); };
	private onResume: () => void = () => { console.warn("noResumeDefined"); };
	private onCollisionDetected: (score: number) => void = (score: number) => { console.warn("onCollisionDetected") }
	private onScoreChanged: (score: number) => void = (score: number) => { console.warn("onCollisionDetected") }

	constructor(_element: HTMLElement) {
		this.element = _element;

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
		this.scene.fog = new THREE.Fog(0x00CCEE, 1, this.fogDistance);
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
		(window as any).camera = this.camera;

		// Set up resizing capabilities.
		window.addEventListener('resize', this.handleWindowResize.bind(this), false);

		// Initialize the lights.
		this.light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
		this.scene.add(this.light);

		// Initialize the character and add it to the scene.
		this.character = new Character();
		this.character.init();
		this.scene.add(this.character.element);

		let ground = createBox(3000, 20, 120000, Colors.sand, 0, -400, -60000);
		this.scene.add(ground);

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

	setOnPause(_onPause: () => void) {
		this.onPause = _onPause;
	}

	setOnResume(_onResume: () => void) {
		this.onResume = _onResume;
	}

	setOnCollisionDetected(_onCollisionDetected: (score: number) => void) {
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

				this.onCollisionDetected(this.score / 15000);
			}

			// Update the scores.
			this.score += 10;
			this.onScoreChanged(this.score);
		}

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
				const tree = new Asteroid(lane * 800, -400, position, scale);
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