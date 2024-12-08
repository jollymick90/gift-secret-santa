import * as THREE from 'three';

import { Colors } from './constant';
import { createCylinder } from './ui-utils';
import { GameObject } from './game.model';

export class Tree implements GameObject {
    public mesh: any;
    scale: number;

    constructor(
        public x: number,
        public y: number,
        public z: number,
        public s: number
    ) {
        // Explicit binding.

        // The object portrayed in the scene.
        this.mesh = new THREE.Object3D();
        const top = createCylinder(1, 300, 300, 4, Colors.green, 0, 1000, 0);
        const mid = createCylinder(1, 400, 400, 4, Colors.green, 0, 800, 0);
        const bottom = createCylinder(1, 500, 500, 4, Colors.green, 0, 500, 0);
        const trunk = createCylinder(100, 100, 250, 32, Colors.brownDark, 0, 125, 0);
        this.mesh.add(top);
        this.mesh.add(mid);
        this.mesh.add(bottom);
        this.mesh.add(trunk);
        this.mesh.position.set(x, y, z);
        this.mesh.scale.set(s, s, s);
        this.scale = s;
    }


    /**
     * A method that detects whether this tree is colliding with the character,
     * which is modelled as a box bounded by the given coordinate space.
     */
    collides(
        minX: number,
        maxX: number,
        minY: number,
        maxY: number,
        minZ: number,
        maxZ: number
    ) {
        const treeMinX = this.mesh.position.x - this.scale * 250;
        const treeMaxX = this.mesh.position.x + this.scale * 250;
        const treeMinY = this.mesh.position.y;
        const treeMaxY = this.mesh.position.y + this.scale * 1150;
        const treeMinZ = this.mesh.position.z - this.scale * 250;
        const treeMaxZ = this.mesh.position.z + this.scale * 250;
        return treeMinX <= maxX && treeMaxX >= minX
            && treeMinY <= maxY && treeMaxY >= minY
            && treeMinZ <= maxZ && treeMaxZ >= minZ;
    }

}