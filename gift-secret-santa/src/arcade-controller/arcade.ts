import { World } from '../games/boxy-run/boxy-run-original';
import { DoughnutStars } from '../games/doughnut-stars/doughut-stars';
import { loadBox2D } from '../games/maze-brain/load-js';
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
    const btnStop = document.getElementById('btnStop');
    const scoreHtml = document.getElementById('score');
    const msgHtml = document.getElementById('msg');
    const indoPointHtml = document.getElementById('info-point');
    const overlayControllerHTML = document.getElementById('overlay-controller');
    const btnOKHtml = document.getElementById('btnOK');

    function handleGameOne() {
        console.log("click game 1");
        homeControls?.classList.add('hidden');
        gameControls?.classList.remove('hidden');

        gameOne?.classList.remove('hidden');
        indoPointHtml?.classList.remove('hidden');

        arcadeArea?.classList.add('hidden');
        gameDoughut?.classList.add('hidden');
        gameMaze?.classList.add('hidden');
        new World({
            _element: document.getElementById('world'),
            output: (props) => {

                if (scoreHtml && props.score) {
                    scoreHtml.innerHTML = props.score;
                }
                if (msgHtml && props.msg) {
                    msgHtml.innerHTML = props.msg.join(" - ")
                }
            }
        })
        btnStop.addEventListener('click', () => {
            location.reload()
        });
    }

    function handleGameStarsRun() {
        console.log("click game 2");
        homeControls?.classList.add('hidden');
        gameControls?.classList.remove('hidden');

        arcadeArea?.classList.add('hidden');
        indoPointHtml?.classList.remove('hidden');

        gameSpace?.classList.remove('hidden');
        gameDoughut?.classList.add('hidden');
        gameMaze?.classList.add('hidden');

        const worldSpacerun = document.getElementById('spacerun');
        const btnLeft = document.getElementById('btnLeft');
        const rightLeft = document.getElementById('btnRight');
        const btnUp = document.getElementById('btnUp');
        const btnPause = document.getElementById('btnPause');
        const btnF = document.getElementById('btnF');
        // const btnD = document.getElementById('btnD');

        if (worldSpacerun) {
            game = new Game({
                _element: worldSpacerun,
                output: (props) => {
                    // console.log("prop", props);
                    if (scoreHtml && props.score) {
                        scoreHtml.innerHTML = `${props.score}`;
                    }
                    if (msgHtml && props.msg) {
                        msgHtml.innerHTML = props.msg.join(" - ");
                    }
                }
            });
            game.startEngine();
            game.setOnPause(() => { 
                console.log("pause")
                btnPause?.classList.add('active')
            });
            game.setOnResume(() => { 
                btnPause?.classList.remove('active')
            });
            game.setFaceDetectionModeActive((active: boolean) => {
                // if (active) {
                //     btnF?.classList.add('active');
                // } else {
                //     btnF?.classList.remove('active');
                // }
            })
            game.setOnCollisionDetected((
                props
            ) => {
                if (scoreHtml && props.score) {
                    scoreHtml.innerHTML = `${props.score}`;
                }
                if (msgHtml && props.msg) {
                    msgHtml.innerHTML = props.msg.join(" - ");
                }
            })
            game.setOnScoreChanged((score: number) => {
                if (scoreHtml && score) {
                    scoreHtml.innerHTML = `${score}`;
                }
            })
            overlayControllerHTML?.classList.remove('hidden');
            btnOKHtml?.addEventListener('click', game.clickOK.bind(game));
            btnLeft?.addEventListener('click', game.clickLeft.bind(game));
            rightLeft?.addEventListener('click', game.clickRight.bind(game));
            btnUp?.addEventListener('click', game.clickUp.bind(game));
            btnPause?.addEventListener('click', game.clickPause.bind(game));
            btnF?.addEventListener('click', game.clickF.bind(game))
            btnStop.addEventListener('click', () => {
                location.reload()
            });
        } else {
            btnStop.addEventListener('click', () => {
                location.reload()
            });
        }
    }

    function handleMazeGame() {
        console.log("click game maze");
        homeControls?.classList.add('hidden');
        gameControls?.classList.remove('hidden');

        gameMaze?.classList.remove('hidden');
        indoPointHtml?.classList.remove('hidden');

        arcadeArea?.classList.add('hidden');
        gameSpace?.classList.add('hidden');
        gameDoughut?.classList.add('hidden');

        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');
        const btnUp = document.getElementById('btnUp');
        const btnDown = document.getElementById('btnDown');

        const worldSpacerun = document.getElementById('maze');

        if (worldSpacerun) {
            msgHtml.innerHTML = "caricamento";
            loadBox2D(() => {
                msgHtml.innerHTML = "pronto";
                console.log('Box2D caricato');
                console.log("run ")
                const maxeGame = MazeBrain(
                    worldSpacerun,
                    (props: any) => {
                        if (msgHtml && props.msg) {
                            msgHtml.innerHTML = props.msg.join(" - ");
                        }
                    }

                );
                btnLeft?.addEventListener('click', maxeGame.clickLeft.bind(maxeGame));
                btnRight?.addEventListener('click', maxeGame.clickRight.bind(maxeGame));
                btnUp?.addEventListener('click', maxeGame.clickUp.bind(maxeGame));
                btnDown?.addEventListener('click', maxeGame.clickDown.bind(maxeGame));
                
                btnLeft?.addEventListener('touchstart', maxeGame.touchStartLeft.bind(maxeGame));
                btnRight?.addEventListener('touchstart', maxeGame.touchStartight.bind(maxeGame));
                btnUp?.addEventListener('touchstart', maxeGame.touchStartckUp.bind(maxeGame));
                btnDown?.addEventListener('touchstart', maxeGame.touchStartDown.bind(maxeGame));

                btnLeft?.addEventListener('touchend', maxeGame.touchEndLeft.bind(maxeGame));
                btnRight?.addEventListener('touchend', maxeGame.touchEndight.bind(maxeGame));
                btnUp?.addEventListener('touchend', maxeGame.touchEndckUp.bind(maxeGame));
                btnDown?.addEventListener('touchend', maxeGame.touchEndDown.bind(maxeGame));
                maxeGame.start();
            });
            btnStop.addEventListener('click', () => {
                location.reload()
            });
        } else {
            btnStop.addEventListener('click', () => {
                location.reload()
            });
        }
    }

    function handleDoughnut() {
        console.log("click game Doughnut");
        homeControls?.classList.add('hidden');
        gameControls?.classList.remove('hidden');

        gameDoughut?.classList.remove('hidden');
        indoPointHtml?.classList.remove('hidden');
        
        gameMaze?.classList.add('hidden');
        arcadeArea?.classList.add('hidden');
        gameSpace?.classList.add('hidden');

        const btnLeft = document.getElementById('btnLeft');
        const btnRight = document.getElementById('btnRight');
        const btnUp = document.getElementById('btnUp');
        const btnDown = document.getElementById('btnDown');

        const worldSpacerun = document.getElementById('doughnut');
        if (worldSpacerun) {
            console.log("run ")
            const doughnutGame = DoughnutStars({
                _element: worldSpacerun,
                output: (props) => {
                    if (scoreHtml && props.score) {
                        scoreHtml.innerHTML = `${props.score}`;
                    }
                    if (msgHtml && props.msg) {
                        msgHtml.innerHTML = props.msg.join(" - ");
                    }
                }
            });
            btnLeft?.addEventListener('click', doughnutGame.clickLeft.bind(doughnutGame));
            btnRight?.addEventListener('click', doughnutGame.clickRight.bind(doughnutGame));
            btnUp?.addEventListener('click', doughnutGame.clickUp.bind(doughnutGame));
            btnDown?.addEventListener('click', doughnutGame.clickDown.bind(doughnutGame));

            doughnutGame.start();
            btnStop.addEventListener('click', () => {
                location.reload()
            });
        } else {
            btnStop.addEventListener('click', () => {
                location.reload()
            });
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