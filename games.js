const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#222',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Nessuna gravità (spaziale)
            debug: false,
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

const game = new Phaser.Game(config);

let player, cursors, stars, obstacles;

function preload() {
    // Carica risorse
    this.load.image('player', '/assets/images/ufo.webp');
    this.load.image('star', '/assets/images/stars.webp');
    this.load.image('obstacle', '/assets/images/red_ball.webp');
}

function create() {
    // Aggiungi il giocatore
    player = this.physics.add.sprite(100, 300, 'player').setScale(0.5);

    // Abilita controlli da tastiera
    cursors = this.input.keyboard.createCursorKeys();

    // Gruppo di stelle (bonus)
    stars = this.physics.add.group({
        key: 'star',
        repeat: 5,
        setXY: { x: 200, y: 100, stepX: 150 },
    });

    // Gruppo di ostacoli
    obstacles = this.physics.add.group();

    // Collide tra player e stelle
    this.physics.add.overlap(player, stars, collectStar, null, this);

    // Timer per creare ostacoli
    this.time.addEvent({
        delay: 1000,
        callback: addObstacle,
        callbackScope: this,
        loop: true,
    });
}

function update() {
    // Controlli del giocatore
    if (cursors.up.isDown) {
        player.setVelocityY(-200);
    } else if (cursors.down.isDown) {
        player.setVelocityY(200);
    } else {
        player.setVelocityY(0);
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);
}

function addObstacle() {
    const x = 800;
    const y = Phaser.Math.Between(50, 550);
    const obstacle = obstacles.create(x, y, 'obstacle');
    obstacle.setVelocityX(-200);
    obstacle.setCollideWorldBounds(false);
}
