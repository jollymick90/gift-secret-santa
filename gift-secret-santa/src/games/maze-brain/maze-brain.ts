import * as THREE from 'three';
import * as BufferGeometryUtils
  from 'three/addons/utils/BufferGeometryUtils.js';

import {
  ballUrl,
  brickUrl,
  concreteUrl,
} from '../../assets';
import { StarFaceDetection } from '../../utils/face-detection';
import { generateSquareMaze } from './maze';

declare const Box2D: any;
declare const jQuery: any;
declare const $: any;

type GenerateMazeMeshProp = {
    dimension: number, [key: number]: number[]
}

export function MazeBrain(
    _element: HTMLElement,
    output: (props: any) => void
) {
    let triggerTouch = 0;
    const speedTouch = 10;
    const element = _element;
    let ballSphereGeom: any;
    let ballMeshPhongMaterial: any;
    let wh: any;
    let h: any;
    let ww: any;
    let w: any;

    let moveUpStart = false;
    let moveDownStart = false;
    let moveRighStart = false;
    let moveLeftStart = false;
    let faceControllerEnabled = false;

    let camera = undefined,
        scene = undefined,
        renderer = undefined,
        light = undefined,
        maze = undefined,
        mazeMesh = undefined,
        mazeDimension: number = 11,
        planeMesh = undefined,
        ballMesh = undefined,
        ballRadius: number = 0.25,
        keyAxis: number[] = [0, 0],
        ironTexture = new THREE.TextureLoader().load(ballUrl),
        planeTexture = new THREE.TextureLoader().load(concreteUrl),
        brickTexture = new THREE.TextureLoader().load(brickUrl),
        gameState = undefined,

        // Box2D shortcuts
        b2World = Box2D.Dynamics.b2World,
        b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
        b2BodyDef = Box2D.Dynamics.b2BodyDef,
        b2Body = Box2D.Dynamics.b2Body,
        b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
        b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
        b2Settings = Box2D.Common.b2Settings,
        b2Vec2 = Box2D.Common.Math.b2Vec2,

        // Box2D world constiables 
        wWorld = undefined,
        wBall = undefined;

    const starFaceDetection = new StarFaceDetection();

    const faceControlBtn = document.getElementById('MazeFaceControlBTN');
    faceControlBtn?.addEventListener('click', () => {
        clickFaceControllerBtn();
        updateFaceControlBtnState();        
    });

    function updateFaceControlBtnState() {
        if (faceControllerEnabled) {
            faceControlBtn?.classList.add('active');
        } else {
            faceControlBtn?.classList.remove('active');
        }
    }
    
    function createPhysicsWorld() {
        // Create the world object.
        wWorld = new b2World(new b2Vec2(0, 0), true);

        // Create the ball.
        const bodyDef = new b2BodyDef();
        bodyDef.type = b2Body.b2_dynamicBody;
        bodyDef.position.Set(1, 1);
        wBall = wWorld.CreateBody(bodyDef);
        const fixDef = new b2FixtureDef();
        fixDef.density = 1.0;
        fixDef.friction = 0.0;
        fixDef.restitution = 0.25;
        fixDef.shape = new b2CircleShape(ballRadius);
        wBall.CreateFixture(fixDef);

        // Create the maze.
        bodyDef.type = b2Body.b2_staticBody;
        fixDef.shape = new b2PolygonShape();
        fixDef.shape.SetAsBox(0.5, 0.5);
        for (let i = 0; i < maze.dimension; i++) {
            for (let j = 0; j < maze.dimension; j++) {
                if (maze[i][j]) {
                    bodyDef.position.x = i;
                    bodyDef.position.y = j;
                    wWorld.CreateBody(bodyDef).CreateFixture(fixDef);
                }
            }
        }
    }

    function generate_maze_mesh(field: GenerateMazeMeshProp) {
        const geometries: THREE.BufferGeometry[] = []; // Array to hold individual geometries

        const geometry = new THREE.BoxGeometry(1, 1, 1); // Base geometry for each cube

        for (let i = 0; i < field.dimension; i++) {
            for (let j = 0; j < field.dimension; j++) {
                if (field[i][j]) {
                    const matrix = new THREE.Matrix4();
                    matrix.makeTranslation(i, j, 0.5); // Set position for each cube

                    // Clone the geometry and apply the transformation
                    const cubeGeometry = geometry.clone();
                    cubeGeometry.applyMatrix4(matrix);

                    geometries.push(cubeGeometry); // Add to array
                }
            }
        }

        // Merge all geometries into a single BufferGeometry
        const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

        // Apply material and create the mesh
        const material = new THREE.MeshPhongMaterial({ map: brickTexture });
        const mesh = new THREE.Mesh(mergedGeometry, material);

        return mesh; // Return the final merged mesh
    }


    function createRenderWorld() {

        // Create the scene object.
        scene = new THREE.Scene();

        // Add the light.
        light = new THREE.PointLight(0xffffff, 1);
        light.position.set(1, 1, 1.3);
        scene.add(light);

        // Add the ball.
        ballSphereGeom = new THREE.SphereGeometry(ballRadius, 32, 16);
        ballMeshPhongMaterial = new THREE.MeshPhongMaterial({ map: ironTexture });
        ballMesh = new THREE.Mesh(ballSphereGeom, ballMeshPhongMaterial);
        ballMesh.position.set(1, 1, ballRadius);
        scene.add(ballMesh);

        // Add the camera.
        const aspect = window.innerWidth / window.innerHeight;
        camera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
        camera.position.set(1, 1, 5);
        scene.add(camera);

        // Add the maze.
        mazeMesh = generate_maze_mesh(maze);
        scene.add(mazeMesh);

        // Add the ground.
        ballSphereGeom = new THREE.PlaneGeometry(mazeDimension * 10, mazeDimension * 10, mazeDimension, mazeDimension);
        planeTexture.wrapS = planeTexture.wrapT = THREE.RepeatWrapping;
        planeTexture.repeat.set(mazeDimension * 5, mazeDimension * 5);
        ballMeshPhongMaterial = new THREE.MeshPhongMaterial({ map: planeTexture });
        planeMesh = new THREE.Mesh(ballSphereGeom, ballMeshPhongMaterial);
        planeMesh.position.set((mazeDimension - 1) / 2, (mazeDimension - 1) / 2, 0);
        planeMesh.rotation.set(Math.PI / 2, 0, 0);
        scene.add(planeMesh);

    }


    function updatePhysicsWorld() {

        // Apply "friction". 
        const lv = wBall.GetLinearVelocity();
        lv.Multiply(0.95);
        wBall.SetLinearVelocity(lv);

        // Apply user-directed force.
        const f = new b2Vec2(keyAxis[0] * wBall.GetMass() * 0.25 * 8, keyAxis[1] * wBall.GetMass() * 0.25 * 8);
        wBall.ApplyImpulse(f, wBall.GetPosition());
        keyAxis = [0, 0];

        // Take a time step.
        wWorld.Step(1 / 60, 8, 3);
    }


    function updateRenderWorld() {

        // Update ball position.
        const stepX = wBall.GetPosition().x - ballMesh.position.x;
        const stepY = wBall.GetPosition().y - ballMesh.position.y;
        ballMesh.position.x += stepX;
        ballMesh.position.y += stepY;

        // Update ball rotation.
        let tempMat = new THREE.Matrix4();
        tempMat.makeRotationAxis(new THREE.Vector3(0, 1, 0), stepX / ballRadius);
        tempMat.multiply(ballMesh.matrix);
        ballMesh.matrix = tempMat;
        tempMat = new THREE.Matrix4();
        tempMat.makeRotationAxis(new THREE.Vector3(1, 0, 0), -stepY / ballRadius);
        tempMat.multiply(ballMesh.matrix);
        ballMesh.matrix = tempMat;
        ballMesh.rotation.setFromRotationMatrix(ballMesh.matrix);

        // Update camera and light positions.
        camera.position.x += (ballMesh.position.x - camera.position.x) * 0.1;
        camera.position.y += (ballMesh.position.y - camera.position.y) * 0.1;
        camera.position.z += (5 - camera.position.z) * 0.1;
        light.position.x = camera.position.x;
        light.position.y = camera.position.y;
        light.position.z = camera.position.z - 3.7;
    }


    function gameLoop() {

        switch (gameState) {

            case 'initialize':
                maze = generateSquareMaze(mazeDimension);
                maze[mazeDimension - 1][mazeDimension - 2] = false;
                createPhysicsWorld();
                createRenderWorld();
                camera.position.set(1, 1, 5);
                light.position.set(1, 1, 1.3);
                light.intensity = 0;
                const level = Math.floor((mazeDimension - 1) / 2 - 4);
                // $('#level').html('Level ' + level);
                output({
                    msg: ['Level ' + level]
                })
                gameState = 'fade in';
                break;

            case 'fade in':
                light.intensity += 0.1 * (1.0 - light.intensity);
                renderer.render(scene, camera);
                if (Math.abs(light.intensity - 1.0) < 0.05) {
                    light.intensity = 1.0;
                    gameState = 'play'
                }
                break;

            case 'play':
                updatePhysicsWorld();
                updateRenderWorld();
                renderer.render(scene, camera);

                // Check for victory.
                const mazeX = Math.floor(ballMesh.position.x + 0.5);
                const mazeY = Math.floor(ballMesh.position.y + 0.5);
                if (mazeX == mazeDimension && mazeY == mazeDimension - 2) {
                    mazeDimension += 2;
                    gameState = 'fade out';
                }
                break;

            case 'fade out':
                updatePhysicsWorld();
                updateRenderWorld();
                light.intensity += 0.1 * (0.0 - light.intensity);
                renderer.render(scene, camera);
                if (Math.abs(light.intensity - 0.0) < 0.1) {
                    light.intensity = 0.0;
                    renderer.render(scene, camera);
                    gameState = 'initialize'
                }
                break;

        }
        triggerTouch++;
        if ((triggerTouch % speedTouch === 0) && moveRighStart) {
            clickRight();
        }
        if ((triggerTouch % speedTouch === 0) && moveLeftStart) {
            clickLeft();
        }
        if ((triggerTouch % speedTouch === 0) && moveUpStart) {
            clickUp();
        }
        if ((triggerTouch % speedTouch === 0) && moveDownStart) {
            clickDown();
        }

        requestAnimationFrame(gameLoop);

    }


    function onResize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }


    function onMoveKey(axis) {
        keyAxis = axis.slice(0);
    }


    jQuery.fn.centerv = function () {
        wh = window.innerHeight;
        h = this.outerHeight();
        this.css("position", "absolute");
        this.css("top", Math.max(0, (wh - h) / 2) + "px");
        return this;
    }


    jQuery.fn.centerh = function () {
        ww = window.innerWidth;
        w = this.outerWidth();
        this.css("position", "absolute");
        this.css("left", Math.max(0, (ww - w) / 2) + "px");
        return this;
    }


    jQuery.fn.center = function () {
        this.centerv();
        this.centerh();
        return this;
    }

    function start() {
    
        starFaceDetection.load();
    
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(
            element.clientWidth,
            element.clientHeight
        );
        element.appendChild(renderer.domElement);

        $(window).resize(onResize);

        gameState = 'initialize';
        requestAnimationFrame(gameLoop);

        starFaceDetection.onController({
            right: () => {
                if (faceControllerEnabled) {
                    clickRight();
                }
            },
            left: () => {
                if (faceControllerEnabled) {
                    clickLeft();
                }
            },
            center: () => { },
			up: () => { },
			down: () => { }
        })
    }

    function clickLeft() {
        onMoveKey([-1, 0])
    }
    
    function clickRight() {
        onMoveKey([1, 0])
    }

    function clickUp() {
        onMoveKey([0, 1])
    }

    function clickDown() {
        onMoveKey([0, -1])
    }

    function clickFaceControllerBtn() {
        faceControllerEnabled = !faceControllerEnabled;
    }

    function touchStartLeft() {
        
        moveLeftStart = true;
    }
    function touchStartRight() {
        
        moveRighStart = true;
    }
    function touchStartckUp() {
        
        moveUpStart = true;
    }
    function touchStartDown() {
        
        moveDownStart = true;
    }

    function touchEndLeft() {
        
        moveLeftStart = false;
    }
    function touchEndRight() {
        
        moveRighStart = false;
    }
    function touchEndckUp() {
        
        moveUpStart = false;
    }
    function touchEndDown() {
        
        moveDownStart = false;
    }

    return {
        start,
        clickLeft,
        clickRight,
        clickUp,
        clickDown,
        clickFaceControllerBtn,
        touchStartLeft,
        touchStartight: touchStartRight,
        touchStartckUp,
        touchStartDown,
        touchEndLeft,
        touchEndight: touchEndRight,
        touchEndckUp,
        touchEndDown,

    }
}