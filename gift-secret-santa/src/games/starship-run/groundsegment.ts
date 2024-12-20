import { Colors, GroundSegmentSize } from "./constant";
import { GameObject } from "./game.model";
import { createBox } from "./ui-utils";

export class GroundSegment implements GameObject {
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