import { World } from '../games/boxy-run/boxy-run-original';
import { DoughnutStars } from '../games/doughnut-stars/doughut-stars';
import { MazeBrain } from '../games/maze-brain/maze-brain';
import { Game } from '../games/starship-run/game';

let game: Game | null = null;
export function runArcadeControl() {
    const arcadeArea = document.getElementById('arcade-area');
    const gameOneBtn = document?.getElementById('gameOneBtn');
    const gameSpaceRunBtn = document?.getElementById('gameSpaceRunBtn');
    const gameDoughnutBtn = document?.getElementById('gameDoughnutBtn');
    const gameMazeBtn = document?.getElementById('gameMazeBtn');
    const homeControls = document.getElementById('home-controls');
    const gameControls = document.getElementById('game-controls');
    const gameOne = document.getElementById('world');
    const gameSpace = document.getElementById('spacerun');
    const gameDoughut = document.getElementById('doughnut');
    const gameMaze = document.getElementById('maze');

    function handleGameOne() {
        console.log("click game 1");
        homeControls?.classList.add('hidden');
        gameControls?.classList.remove('hidden');

        gameOne?.classList.remove('hidden');

        arcadeArea?.classList.add('hidden');
        gameDoughut?.classList.add('hidden');
        gameMaze?.classList.add('hidden');
        new World()
    }

    function handleGameStarsRun() {
        console.log("click game 2");
        homeControls?.classList.add('hidden');
        gameControls?.classList.remove('hidden');

        arcadeArea?.classList.add('hidden');

        gameSpace?.classList.remove('hidden');
        gameDoughut?.classList.add('hidden');
        gameMaze?.classList.add('hidden');

        const worldSpacerun = document.getElementById('spacerun');
        const btnLeft = document.getElementById('btnLeft');
        const rightLeft = document.getElementById('btnRight');
        if (worldSpacerun) {
            game = new Game({
                _element: worldSpacerun,
                output: (prop) => {
                    console.log("prop", prop);
                }
            });
            game.init();
            game.setOnPause(() => { });
            game.setOnResume(() => { });
            game.setOnCollisionDetected((score: number) => { })
            game.setOnScoreChanged((score: number) => { })
            btnLeft?.addEventListener('click', game.clickLeft.bind(game));
            rightLeft?.addEventListener('click', game.clickRight.bind(game));

        }
    }

    function handleMazeGame() {
        console.log("click game maze");
        homeControls?.classList.add('hidden');
        gameControls?.classList.remove('hidden');

        gameMaze?.classList.remove('hidden');

        arcadeArea?.classList.add('hidden');
        gameSpace?.classList.add('hidden');
        gameDoughut?.classList.add('hidden');

        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');
        const btnUp = document.getElementById('btnUp');
        const btnDown = document.getElementById('btnDown');
        const btnStop = document.getElementById('btnStop');
        const worldSpacerun = document.getElementById('maze');
        if (worldSpacerun) {
            console.log("run ")
            const maxeGame = MazeBrain(worldSpacerun);
            btnLeft?.addEventListener('click', maxeGame.clickLeft.bind(maxeGame));
            btnRight?.addEventListener('click', maxeGame.clickRight.bind(maxeGame));
            btnUp?.addEventListener('click', maxeGame.clickUp.bind(maxeGame));
            btnDown?.addEventListener('click', maxeGame.clickDown.bind(maxeGame));
            maxeGame.start();
        }

    }

    function handleDoughnut() {
        console.log("click game Doughnut");
        homeControls?.classList.add('hidden');
        gameControls?.classList.remove('hidden');

        gameDoughut?.classList.remove('hidden');

        gameMaze?.classList.add('hidden');
        arcadeArea?.classList.add('hidden');
        gameSpace?.classList.add('hidden');
        
        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');
        const btnUp = document.getElementById('btnUp');
        const btnDown = document.getElementById('btnDown');
        const btnStop = document.getElementById('btnStop');

        const worldSpacerun = document.getElementById('doughnut');
        if (worldSpacerun) {
            console.log("run ")
            const doughnutGame = DoughnutStars({
                _element: worldSpacerun,
                output: (prop) => {
                    
                }
            });
            btnLeft?.addEventListener('click', doughnutGame.clickLeft.bind(doughnutGame));
            btnRight?.addEventListener('click', doughnutGame.clickRight.bind(doughnutGame));
            btnUp?.addEventListener('click', doughnutGame.clickUp.bind(doughnutGame));
            btnDown?.addEventListener('click', doughnutGame.clickDown.bind(doughnutGame));
          
            doughnutGame.animate();
        }

    }
    gameOneBtn?.addEventListener(
        'click',
        handleGameOne
    )

    gameSpaceRunBtn?.addEventListener(
        'click',
        handleGameStarsRun
    )
    gameDoughnutBtn?.addEventListener(
        'click',
        handleDoughnut
    )
    gameMazeBtn?.addEventListener(
        'click',
        handleMazeGame
    )
}