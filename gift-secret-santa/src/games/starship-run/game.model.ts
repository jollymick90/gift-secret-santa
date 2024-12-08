export interface GameObject {
    mesh: any;
    x: number;
    y: number;
    z: number;
    s: number;

    collides(minX: number,
        maxX: number,
        minY: number,
        maxY: number,
        minZ: number,
        maxZ: number): boolean;
}