import * as THREE from 'three';
import { Character } from './character';
import { Colors } from './constant';
import { Tree } from './tree';
import { createBox } from './ui-utils';


export class Game {
    element: any;
    scene: any;
    camera: any;
    character: any;
    renderer: any;
    light: any;
    objects: any;
    paused: boolean = false;
    keysAllowed: any;
    score: any;
    difficulty: any;
    treePresenceProb: any;
    maxTreeSize: any;
    gameOver: any;
    fogDistance: number;

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
		this.scene.fog = new THREE.Fog(0xbadbe4, 1, this.fogDistance);
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
		window.addEventListener('resize', this.handleWindowResize, false);

		// Initialize the lights.
		this.light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
		this.scene.add(this.light);

		// Initialize the character and add it to the scene.
		this.character = new Character();
		this.scene.add(this.character.element);

		var ground = createBox(3000, 20, 120000, Colors.sand, 0, -400, -60000);
		this.scene.add(ground);

		this.objects = [];
		this.treePresenceProb = 0.2;
		this.maxTreeSize = 0.5;
		for (var i = 10; i < 40; i++) {
			this.createRowOfTrees(i * -3000, this.treePresenceProb, 0.5, this.maxTreeSize);
		}

		// The game is paused to begin with and the game is not over.
		this.gameOver = false;
		this.paused = true;


        this.keysAllowed = {};

        		// Initialize the scores and difficulty.
		this.score = 0;
		this.difficulty = 0;
		// document?.getElementById("score")?.innerHTML = this.score;



        // document.addEventListener(
		// 	'keydown',
        //     onKeyDown()
		// );
		// document.addEventListener(
		// 	'keyup',
		// 	function(e) {
		// 		this.keysAllowed[e.keyCode] = true;
		// 	}
		// );
		// document.addEventListener(
		// 	'focus',
		// 	function(e) {
		// 		this.keysAllowed = {};
		// 	}
		// );

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
			if ((this.objects[this.objects.length - 1].mesh.position.z) % 3000 == 0) {
				this.difficulty += 1;
				var levelLength = 30;
				if (this.difficulty % levelLength == 0) {
					var level = this.difficulty / levelLength;
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
				this.createRowOfTrees(-120000, this.treePresenceProb, 0.5, this.maxTreeSize);
				this.scene.fog.far = this.fogDistance;
			}

			// Move the trees closer to the character.
			this.objects.forEach(function(object) {
				object.mesh.position.z += 100;
			});

			// Remove trees that are outside of the world.
			this.objects = this.objects.filter(function(object) {
				return object.mesh.position.z < 0;
			});

			// Make the character move according to the controls.
			this.character.update();

			// Check for collisions between the character and objects.
			if (this.collisionsDetected()) {
				this.gameOver = true;
				this.paused = true;
				// document.addEventListener(
        		// 	'keydown',
        		// 	function(e) {
        		// 		if (e.keyCode == 40)
            	// 		document.location.reload(true);
        		// 	}
    			// );
    			var variableContent: any = document.getElementById("variable-content");
    			variableContent.style.visibility = "visible";
    			variableContent.innerHTML = 
    				"Game over! Press the down arrow to try again.";
    			var table: any = document.getElementById("ranks");
    			var rankNames = ["Typical Engineer", "Couch Potato", "Weekend Jogger", "Daily Runner",
    				"Local Prospect", "Regional Star", "National Champ", "Second Mo Farah"];
    			var rankIndex: number = Math.floor(this.score / 15000);

				// If applicable, display the next achievable rank.
				if (this.score < 124000) {
					var nextRankRow = table.insertRow(0);
					nextRankRow.insertCell(0).innerHTML = (rankIndex <= 5)
						? "".concat(`${(rankIndex + 1) * 15}`, "k-", `${(rankIndex + 2) * 15}`, "k")
						: (rankIndex == 6)
							? "105k-124k"
							: "124k+";
					nextRankRow.insertCell(1).innerHTML = "*Score within this range to earn the next rank*";
				}

				// Display the achieved rank.
				var achievedRankRow = table.insertRow(0);
				achievedRankRow.insertCell(0).innerHTML = (rankIndex <= 6)
					? "".concat(`${(rankIndex + 1) * 15}`, "k-", `${(rankIndex + 1) * 15}`, "k").bold()
					: (this.score < 124000)
						? "105k-124k".bold()
						: "124k+".bold();
				achievedRankRow.insertCell(1).innerHTML = (rankIndex <= 6)
					? "Congrats! You're a ".concat(rankNames[rankIndex], "!").bold()
					: (this.score < 124000)
						? "Congrats! You're a ".concat(rankNames[7], "!").bold()
						: "Congrats! You exceeded the creator's high score of 123790 and beat the game!".bold();

    			// Display all ranks lower than the achieved rank.
    			if (this.score >= 120000) {
    				rankIndex = 7;
    			}
    			for (var i = 0; i < rankIndex; i++) {
    				var row = table.insertRow(i);
    				row.insertCell(0).innerHTML = "".concat(`${i * 15}`, "k-", `${(i + 1) * 15}`, "k");
    				row.insertCell(1).innerHTML = rankNames[i];
    			}
    			if (this.score > 124000) {
    				var row = table.insertRow(7);
    				row.insertCell(0).innerHTML = "105k-124k";
    				row.insertCell(1).innerHTML = rankNames[7];
    			}

			}

			// Update the scores.
			this.score += 10;
			//document.getElementById("score").innerHTML = score;

		}

		// Render the page and repeat.
		this.renderer.render(this.scene, this.camera);
		requestAnimationFrame(this.loop.bind(this));
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
	createRowOfTrees(position, probability, minScale, maxScale) {
		for (var lane = -1; lane < 2; lane++) {
			var randomNumber = Math.random();
			if (randomNumber < probability) {
				var scale = minScale + (maxScale - minScale) * Math.random();
				var tree = new Tree(lane * 800, -400, position, scale);
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
 		var charMinX = this.character.element.position.x - 115;
 		var charMaxX = this.character.element.position.x + 115;
 		var charMinY = this.character.element.position.y - 310;
 		var charMaxY = this.character.element.position.y + 320;
 		var charMinZ = this.character.element.position.z - 40;
 		var charMaxZ = this.character.element.position.z + 40;
 		for (var i = 0; i < this.objects.length; i++) {
 			if (this.objects[i].collides(charMinX, charMaxX, charMinY, 
 					charMaxY, charMinZ, charMaxZ)) {
 				return true;
 			}
 		}
 		return false;
 	}

     onKeyDown(e: any) {
        		// Start receiving feedback from the player.
		var left = 37;
		var up = 38;
		var right = 39;
		var p = 80;
        if (!this.gameOver) {
            var key = e.keyCode;
            if (this.keysAllowed[key] === false) return;
            this.keysAllowed[key] = false;
            if (this.paused && !this.collisionsDetected() && key > 18) {
                this.paused = false;
                this.character.onUnpause();
                // document.getElementById("variable-content").style.visibility = "hidden";
                // document.getElementById("controls").style.display = "none";
            } else {
                if (key == p) {
                    this.paused = true;
                    this.character.onPause();
                    // document.getElementById(
                    //     "variable-content").style.visibility = "visible";
                    // document.getElementById(
                    //     "variable-content").innerHTML = 
                    //     "Game is paused. Press any key to resume.";
                }
                if (key == up && !this.paused) {
                    this.character.onUpKeyPressed();
                }
                if (key == left && !this.paused) {
                    this.character.onLeftKeyPressed();
                }
                if (key == right && !this.paused) {
                    this.character.onRightKeyPressed();
                }
            }
        }
     }
	
}