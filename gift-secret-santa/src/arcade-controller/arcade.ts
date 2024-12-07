import { World } from "../games/boxy-run/boxy-run-original";

export function runArcadeControl() {
    const arcadeArea = document.getElementById('arcade-area');
    const gameOneButton = document?.getElementById('gameOne');
    const gameTwoButton = document?.getElementById('gameTwo');
    const homeControls = document.getElementById('home-controls');
    const gameControls = document.getElementById('game-controls');
    const gameOne = document.getElementById('world');
    const gameTwo = document.getElementById('spacerun');
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

        gameTwoButton?.addEventListener(
            'click',
            function () {
                console.log("click game 2")
                homeControls?.classList.add('hidden');
                gameControls?.classList.remove('hidden');
    
                gameTwo?.classList.remove('hidden');
                arcadeArea?.classList.add('hidden');
                
            })
    
}