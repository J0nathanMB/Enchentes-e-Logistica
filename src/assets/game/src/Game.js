// Verificação do Capacitor para funcionalidades nativas
let triggerHapticFeedback = function () {
    if (typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        const { Haptics, ImpactStyle } = window.Capacitor.Plugins;
        Haptics.impact({ style: ImpactStyle.Medium });
    } else {
        console.log('Haptic feedback não disponível no navegador.');
    }
};

// Classe do jogo
Ball.Game = function (game) { };

Ball.Game.prototype = {
    create: function () {
        this.setupGame();
        this.setupUI();
        this.setupPhysics();
        this.setupAudio();
        this.setupAccelerometer();
    },

    setupGame: function () {
        // Configuração inicial
        this.add.sprite(0, 0, 'screen-bg');
        this.add.sprite(0, 0, 'panel');
        this.timer = 0;
        this.totalTimer = 0;
        this.level = 1;
        this.maxLevels = 5;
        this.movementForce = 10;
        this.ballStartPos = { x: Ball._WIDTH * 0.5, y: 450 };

        // Criação da bola
        this.ball = this.add.sprite(this.ballStartPos.x, this.ballStartPos.y, 'ball');
        this.ball.anchor.set(0.5);
        this.physics.enable(this.ball, Phaser.Physics.ARCADE);
        this.ball.body.setSize(18, 18);
        this.ball.body.bounce.set(0.3, 0.3);

        // Configuração do buraco
        this.hole = this.add.sprite(Ball._WIDTH * 0.5, 90, 'hole');
        this.physics.enable(this.hole, Phaser.Physics.ARCADE);
        this.hole.anchor.set(0.5);
        this.hole.body.setSize(2, 2);

        // Configuração dos níveis
        this.initLevels();
        this.showLevel(1);
        Ball._player = this.ball;
    },

    setupUI: function () {
        // Configuração de texto e botões
        this.fontSmall = { font: "16px Arial", fill: "#e4beef" };
        this.fontBig = { font: "24px Arial", fill: "#e4beef" };
        this.fontMessage = { font: "24px Arial", fill: "#e4beef", align: "center", stroke: "#320C3E", strokeThickness: 4 };

        this.pauseButton = this.add.button(Ball._WIDTH - 8, 8, 'button-pause', this.managePause, this);
        this.pauseButton.anchor.set(1, 0);
        this.pauseButton.input.useHandCursor = true;

        this.audioButton = this.add.button(Ball._WIDTH - this.pauseButton.width - 16, 8, 'button-audio', this.manageAudio, this);
        this.audioButton.anchor.set(1, 0);
        this.audioButton.input.useHandCursor = true;
        this.audioButton.animations.add('true', [0], 10, true);
        this.audioButton.animations.add('false', [1], 10, true);
        this.audioButton.animations.play(this.audioStatus);

        this.timerText = this.game.add.text(15, 15, "Time: " + this.timer, this.fontBig);
        this.levelText = this.game.add.text(120, 10, "Level: " + this.level + " / " + this.maxLevels, this.fontSmall);
        this.totalTimeText = this.game.add.text(120, 30, "Total time: " + this.totalTimer, this.fontSmall);
    },

    setupPhysics: function () {
        // Configuração inicial da física
        this.physics.startSystem(Phaser.Physics.ARCADE);

        this.borderGroup = this.add.group();
        this.borderGroup.enableBody = true;
        this.borderGroup.physicsBodyType = Phaser.Physics.ARCADE;
        this.borderGroup.create(0, 50, 'border-horizontal');
        this.borderGroup.create(0, Ball._HEIGHT - 2, 'border-horizontal');
        this.borderGroup.create(0, 0, 'border-vertical');
        this.borderGroup.create(Ball._WIDTH - 2, 0, 'border-vertical');
        this.borderGroup.setAll('body.immovable', true);

        this.keys = this.game.input.keyboard.createCursorKeys();
    },

    setupAudio: function () {
        this.audioStatus = true;
        this.bounceSound = this.game.add.audio('audio-bounce');
    },

    setupAccelerometer: function () {
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        this.configureAccelerometer();
                    } else {
                        console.log('Permissão negada para o uso do acelerômetro.');
                    }
                })
                .catch(console.error);
        } else {
            this.configureAccelerometer(); // Acelerômetro disponível sem permissão
        }
    },

    configureAccelerometer: function () {
        const self = this;

        if (typeof window.DeviceMotionEvent !== 'undefined') {
            window.addEventListener('devicemotion', function (event) {
                const x = event.accelerationIncludingGravity.x;
                const y = event.accelerationIncludingGravity.y;

                if (x && y) {
                    self.ball.body.velocity.x += x * self.movementForce;
                    self.ball.body.velocity.y -= y * self.movementForce;
                }
            });
        } else {
            console.log('Acelerômetro não disponível.');
        }
    },

    initLevels: function () {
        this.levels = [];
        this.levelData = [
            [{ x: 96, y: 224, t: 'w' }],
            [{ x: 72, y: 320, t: 'w' }, { x: 200, y: 320, t: 'h' }, { x: 72, y: 150, t: 'w' }],
            [{ x: 64, y: 352, t: 'h' }, { x: 224, y: 352, t: 'h' }, { x: 0, y: 240, t: 'w' }, { x: 128, y: 240, t: 'w' }, { x: 200, y: 52, t: 'h' }],
            [{ x: 78, y: 352, t: 'h' }, { x: 78, y: 320, t: 'w' }, { x: 0, y: 240, t: 'w' }, { x: 192, y: 240, t: 'w' }, { x: 30, y: 150, t: 'w' }, { x: 158, y: 150, t: 'w' }],
            [{ x: 188, y: 352, t: 'h' }, { x: 92, y: 320, t: 'w' }, { x: 0, y: 240, t: 'w' }, { x: 128, y: 240, t: 'w' }, { x: 256, y: 240, t: 'h' }, { x: 180, y: 52, t: 'h' }, { x: 52, y: 148, t: 'w' }]
        ];

        for (let i = 0; i < this.maxLevels; i++) {
            const newLevel = this.add.group();
            newLevel.enableBody = true;
            newLevel.physicsBodyType = Phaser.Physics.ARCADE;

            this.levelData[i].forEach(item => {
                newLevel.create(item.x, item.y, 'element-' + item.t);
            });

            newLevel.setAll('body.immovable', true);
            newLevel.visible = false;
            this.levels.push(newLevel);
        }
    },

    showLevel: function (level) {
        const lvl = level || this.level;
        if (this.levels[lvl - 2]) {
            this.levels[lvl - 2].visible = false;
        }
        this.levels[lvl - 1].visible = true;
    },

    updateCounter: function () {
        this.timer++;
        this.timerText.setText("Time: " + this.timer);
        this.totalTimeText.setText("Total time: " + (this.totalTimer + this.timer));
    },

    managePause: function () {
        this.game.paused = true;
        const pausedText = this.add.text(Ball._WIDTH * 0.5, 250, "Game paused,\ntap anywhere to continue.", this.fontMessage);
        pausedText.anchor.set(0.5);
        this.input.onDown.add(() => {
            pausedText.destroy();
            this.game.paused = false;
        });
    },

    manageAudio: function () {
        this.audioStatus = !this.audioStatus;
        this.audioButton.animations.play(this.audioStatus);
    },

    update: function () {
        // Controles de teclado (fallback)
        if (this.keys.left.isDown) {
            this.ball.body.velocity.x -= this.movementForce;
        } else if (this.keys.right.isDown) {
            this.ball.body.velocity.x += this.movementForce;
        }
        if (this.keys.up.isDown) {
            this.ball.body.velocity.y -= this.movementForce;
        } else if (this.keys.down.isDown) {
            this.ball.body.velocity.y += this.movementForce;
        }

        // Limitação de velocidade
        this.ball.body.velocity.x = Phaser.Math.clamp(this.ball.body.velocity.x, -200, 200);
        this.ball.body.velocity.y = Phaser.Math.clamp(this.ball.body.velocity.y, -200, 200);

        this.physics.arcade.collide(this.ball, this.borderGroup, this.wallCollision, null, this);
        this.physics.arcade.collide(this.ball, this.levels[this.level - 1], this.wallCollision, null, this);
        this.physics.arcade.overlap(this.ball, this.hole, this.finishLevel, null, this);
    },

    wallCollision: function () {
        if (this.audioStatus) {
            this.bounceSound.play();
        }
        triggerHapticFeedback('Heavy');
    },

    finishLevel: function () {
        if (this.level >= this.maxLevels) {
            this.totalTimer += this.timer;
            alert('Congratulations, game completed!\nTotal time of play: ' + this.totalTimer + ' seconds!');
            this.game.state.start('MainMenu');
        } else {
            alert('Congratulations, level ' + this.level + ' completed!');
            this.totalTimer += this.timer;
            this.timer = 0;
            this.level++;
            this.timerText.setText("Time: " + this.timer);
            this.totalTimeText.setText("Total time: " + this.totalTimer);
            this.levelText.setText("Level: " + this.level + " / " + this.maxLevels);
            this.ball.body.x = this.ballStartPos.x;
            this.ball.body.y = this.ballStartPos.y;
            this.ball.body.velocity.x = 0;
            this.ball.body.velocity.y = 0;
            this.showLevel();
        }
    }
};
