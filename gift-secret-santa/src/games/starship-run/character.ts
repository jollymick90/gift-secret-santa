import {
  Colors,
  deg2Rad,
} from './constant';
import {
  createBox,
  createGroup,
  sinusoid,
} from './ui-utils';

/**
 * The player's character in the game.
 */
export class Character {

	// Explicit binding of this even in changing contexts.

	// Character defaults that don't change throughout the game.
    skinColor: any;
    hairColor: any;
    shirtColor: any;
    shortsColor: any;
    jumpDuration: any;
    jumpHeight: any;
    face: any;
    hair: any;
    head: any;
    torso: any;
    leftLowerArm: any;
    leftArm: any;
    rightLowerArm: any;
    rightArm: any;
    leftLowerLeg: any;
    leftLeg: any;
    rightLowerLeg: any;
    rightLeg: any;
    element: any;
    isJumping: boolean = false;
    isSwitchingLeft: boolean = false;
    isSwitchingRight: boolean = false;
    currentLane: number = 0;
    runningStartTime: number = 0;
    pauseStartTime: number = 0;
    stepFreq: number = 0;
    queuedActions: string[] = [];
    jumpStartTime: number = 0;

    constructor() {
        this.skinColor = Math.random() > 0.4 ? Colors.brown : Colors.white;
        this.hairColor = Colors.black;
        this.shirtColor = Math.random() > 0.4 ? Colors.blue : Colors.yellow;
        this.shortsColor = Colors.olive;
        this.jumpDuration = 0.6;
        this.jumpHeight = 2000;
    }


	/**
	  * Builds the character in depth-first order. The parts of are 
  	  * modelled by the following object hierarchy:
	  *
	  * - character (this.element)
	  *    - head
	  *       - face
	  *       - hair
	  *    - torso
	  *    - leftArm
	  *       - leftLowerArm
	  *    - rightArm
	  *       - rightLowerArm
	  *    - leftLeg
	  *       - rightLowerLeg
	  *    - rightLeg
	  *       - rightLowerLeg
	  *
	  * Also set up the starting values for evolving parameters throughout
	  * the game.
	  * 
	  */
	init() {

		// Build the character.
		this.face = createBox(100, 100, 60, this.skinColor, 0, 0, 0);
		this.hair = createBox(105, 20, 65, this.hairColor, 0, 50, 0);
		this.head = createGroup(0, 260, -25);
		this.head.add(this.face);
		this.head.add(this.hair);

		this.torso = createBox(150, 190, 40, this.shirtColor, 0, 100, 0);

		this.leftLowerArm = this.createLimb(20, 120, 30, this.skinColor, 0, -170, 0);
		this.leftArm = this.createLimb(30, 140, 40, this.skinColor, -100, 190, -10);
		this.leftArm.add(this.leftLowerArm);

		this.rightLowerArm = this.createLimb(
			20, 120, 30, this.skinColor, 0, -170, 0);
		this.rightArm =this.createLimb(30, 140, 40, this.skinColor, 100, 190, -10);
		this.rightArm.add(this.rightLowerArm);

		this.leftLowerLeg = this.createLimb(40, 200, 40, this.skinColor, 0, -200, 0);
		this.leftLeg =this.createLimb(50, 170, 50, this.shortsColor, -50, -10, 30);
		this.leftLeg.add(this.leftLowerLeg);

		this.rightLowerLeg = this.createLimb(
			40, 200, 40, this.skinColor, 0, -200, 0);
		this.rightLeg = this.createLimb(50, 170, 50, this.shortsColor, 50, -10, 30);
		this.rightLeg.add(this.rightLowerLeg);

		this.element = createGroup(0, 0, -4000);
		this.element.add(this.head);
		this.element.add(this.torso);
		this.element.add(this.leftArm);
		this.element.add(this.rightArm);
		this.element.add(this.leftLeg);
		this.element.add(this.rightLeg);

		// Initialize the player's changing parameters.
		this.isJumping = false;
		this.isSwitchingLeft = false;
		this.isSwitchingRight = false;
		this.currentLane = 0;
		this.runningStartTime = new Date().getTime() / 1000;
		this.pauseStartTime = new Date().getTime() / 1000;
		this.stepFreq = 2;
		this.queuedActions = [];

	}


	/**
	 * Creates and returns a limb with an axis of rotation at the top.
	 *
	 * @param {number} DX The width of the limb.
	 * @param {number} DY The length of the limb.
	 * @param {number} DZ The depth of the limb.
	 * @param {color} COLOR The color of the limb.
	 * @param {number} X The x-coordinate of the rotation center.
	 * @param {number} Y The y-coordinate of the rotation center.
	 * @param {number} Z The z-coordinate of the rotation center.
	 * @return {THREE.GROUP} A group that includes a box representing
	 *                       the limb, with the specified properties.
	 *
	 */
	createLimb(dx: number, dy: number, dz: number, color: any, x:number, y: number, z: number) {
	    var limb = createGroup(x, y, z);
	    var offset = -1 * (Math.max(dx, dz) / 2 + dy / 2);
		var limbBox = createBox(dx, dy, dz, color, 0, offset, 0);
		limb.add(limbBox);
		return limb;
	}
	
	/**
	 * A method called on the character when time moves forward.
	 */
	update() {

		// Obtain the curren time for future calculations.
		const currentTime = (new Date().getTime()) / 1000;

		// Apply actions to the character if none are currently being
		// carried out.
		if (!this.isJumping &&
			!this.isSwitchingLeft &&
			!this.isSwitchingRight &&
			this.queuedActions.length > 0) {
			switch(this.queuedActions.shift()) {
				case "up":
					this.isJumping = true;
					this.jumpStartTime = new Date().getTime() / 1000;
					break;
				case "left":
					if (this.currentLane != -1) {
						this.isSwitchingLeft = true;
					}
					break;
				case "right":
					if (this.currentLane != 1) {
						this.isSwitchingRight = true;
					}
					break;
			}
		}

		// If the character is jumping, update the height of the character.
		// Otherwise, the character continues running.
		if (this.isJumping) {
			var jumpClock = currentTime - this.jumpStartTime;
			this.element.position.y = this.jumpHeight * Math.sin(
				(1 / this.jumpDuration) * Math.PI * jumpClock) +
				sinusoid(2 * this.stepFreq, 0, 20, 0,
					this.jumpStartTime - this.runningStartTime);
			if (jumpClock > this.jumpDuration) {
				this.isJumping = false;
				this.runningStartTime += this.jumpDuration;
			}
		} else {
			var runningClock = currentTime - this.runningStartTime;
			this.element.position.y = sinusoid(
				2 * this.stepFreq, 0, 20, 0, runningClock);
			this.head.rotation.x = sinusoid(
				2 * this.stepFreq, -10, -5, 0, runningClock) * deg2Rad;
			this.torso.rotation.x = sinusoid(
				2 * this.stepFreq, -10, -5, 180, runningClock) * deg2Rad;
			this.leftArm.rotation.x = sinusoid(
				this.stepFreq, -70, 50, 180, runningClock) * deg2Rad;
			this.rightArm.rotation.x = sinusoid(
				this.stepFreq, -70, 50, 0, runningClock) * deg2Rad;
			this.leftLowerArm.rotation.x = sinusoid(
				this.stepFreq, 70, 140, 180, runningClock) * deg2Rad;
			this.rightLowerArm.rotation.x = sinusoid(
				this.stepFreq, 70, 140, 0, runningClock) * deg2Rad;
			this.leftLeg.rotation.x = sinusoid(
				this.stepFreq, -20, 80, 0, runningClock) * deg2Rad;
			this.rightLeg.rotation.x = sinusoid(
				this.stepFreq, -20, 80, 180, runningClock) * deg2Rad;
			this.leftLowerLeg.rotation.x = sinusoid(
				this.stepFreq, -130, 5, 240, runningClock) * deg2Rad;
			this.rightLowerLeg.rotation.x = sinusoid(
				this.stepFreq, -130, 5, 60, runningClock) * deg2Rad;

			// If the character is not jumping, it may be switching lanes.
			if (this.isSwitchingLeft) {
				this.element.position.x -= 200;
				var offset = this.currentLane * 800 - this.element.position.x;
				if (offset > 800) {
					this.currentLane -= 1;
					this.element.position.x = this.currentLane * 800;
					this.isSwitchingLeft = false;
				}
			}
			if (this.isSwitchingRight) {
				this.element.position.x += 200;
				var offset = this.element.position.x - this.currentLane * 800;
				if (offset > 800) {
					this.currentLane += 1;
					this.element.position.x = this.currentLane * 800;
					this.isSwitchingRight = false;
				}
			}
		}
	}

	/**
	  * Handles character activity when the left key is pressed.
	  */
	onLeftKeyPressed() {
		this.queuedActions.push("left");
	}

	/**
	  * Handles character activity when the up key is pressed.
	  */
	onUpKeyPressed() {
		this.queuedActions.push("up");
	}

	/**
	  * Handles character activity when the right key is pressed.
	  */
	onRightKeyPressed() {
		this.queuedActions.push("right");
	}

	/**
	  * Handles character activity when the game is paused.
	  */
	onPause() {
		this.pauseStartTime = new Date().getTime() / 1000;
	}

	/**
	  * Handles character activity when the game is unpaused.
	  */
	onUnpause() {
		var currentTime = new Date().getTime() / 1000;
		var pauseDuration = currentTime - this.pauseStartTime;
		this.runningStartTime += pauseDuration;
		if (this.isJumping) {
			this.jumpStartTime += pauseDuration;
		}
	}

}