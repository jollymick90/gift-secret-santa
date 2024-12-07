import { World } from "../games/boxy-run/boxy-run-original";

export function runArcadeControl() {
    const arcadeArea = document.getElementById('arcade-area');
    const gameOneButton = document?.getElementById('gameOne');
    const homeControls = document.getElementById('home-controls');
    const gameControls = document.getElementById('game-controls');
    const gameOne = document.getElementById('world');
    gameOneButton?.addEventListener(
        'click',
        function () {
            console.log("click game 1")
            homeControls?.classList.add('hidden');
            gameControls?.classList.remove('hidden');


            gameOne?.classList.remove('hidden');
            arcadeArea?.classList.add('hidden');
            new World()
        })
}