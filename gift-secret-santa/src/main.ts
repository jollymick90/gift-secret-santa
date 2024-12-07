import { runArcadeControl } from './arcade-controller/arcade';
import { World } from './games/boxy-run/boxy-run-original';
import './style.css';
// import { Game } from './world';

window.addEventListener('load', function() {
    runArcadeControl();
 
    // const element = document.getElementById('world');
    // if (element) {
    //     const world = new Game(element);
    //     world.init()
    // } else {

    // }

});
