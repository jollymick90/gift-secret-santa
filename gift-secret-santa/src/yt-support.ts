class Game {
    constructor() {
        console.log('Game creato!');
    }
}

const game1 = new Game();


function World() {
    console.log('World creato!');

}

const world = World();

const world1 = new World();

function DoughnutStars() {
    console.log('World creato!');
    function start() {
        // startCamera()

        // animate();
    }
    return {
        start
    }
}

const doughut = DoughnutStars();
doughut.start()
//@ts-ignore
const doughut2 = new DoughnutStars();
doughut2.start();

function somma(a: number, b: number): number {
    return a + b;
  }
  
  const risultato = somma(2, 3);
  console.log(risultato); // 5

interface WolrdI {

}

type GameType = {
    wolrd: WolrdI,
    id: string,
    width: number,
    isValid: boolean
}