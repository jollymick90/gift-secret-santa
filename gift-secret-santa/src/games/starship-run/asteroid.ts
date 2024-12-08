import * as THREE from 'three';
import { Colors } from './constant';
import { GameObject } from './game.model';

export class Asteroid implements GameObject {
    public mesh: any;
    scale: number;

    constructor(
        public x: number,
        public y: number,
        public z: number,
        public s: number
    ) {
        this.mesh = new THREE.Object3D();

        // Geometria base: Icosaedro
        const geom = new THREE.IcosahedronGeometry(600, 1); // Suddivisione minima (1) per mantenere una geometria semplice

        // Randomizzazione dei vertici per un aspetto irregolare
        const positions = geom.attributes.position.array; // Otteniamo la posizione dei vertici
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += Math.random() * 50 - 25; // Perturbazione casuale sull'asse X
            positions[i + 1] += Math.random() * 50 - 25; // Perturbazione casuale sull'asse Y
            positions[i + 2] += Math.random() * 50 - 25; // Perturbazione casuale sull'asse Z
        }

        geom.computeVertexNormals(); // Ricomputa le normali per rendere il modello realistico

        // Materiale scuro per simulare una roccia
        const mat = new THREE.MeshPhongMaterial({
            color: Colors.blue,
            flatShading: true, // Ombre piatte per un look più "grezzo"
        });

        // Creazione della mesh
        const asteroid = new THREE.Mesh(geom, mat);

        // Configurazione ombre
        asteroid.castShadow = true;
        asteroid.receiveShadow = true;

        // Aggiunta della mesh all'oggetto principale
        this.mesh.add(asteroid);

        // Posizionamento e scalatura
        this.mesh.position.set(x, y, z);
        this.mesh.scale.set(s, s, s);
        this.scale = s;
    }

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