import * as THREE from 'three';

class World {
    element: any;
    scene: any;
    camera: any;
    character: any;
    renderer: any;
    light: any;
    objects: any;
    paused: any;
    keysAllowed: any;
    score: any;
    difficulty: any;
    treePresenceProb: any;
    maxTreeSize: any;
    fogDistance: any;
    gameOver: any;
    fogDistance: number;

    constructor(_element: HTMLElement) {
        this.element = _element;

        this.renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true
		});

        this.renderer.setSize(this.element.clientWidth, this.element.clientHeight);
		this.renderer.shadowMap.enabled = true;

        this.element.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
		this.fogDistance = 40000;
		this.scene.fog = new THREE.Fog(0xbadbe4, 1, this.fogDistance);
    }
}