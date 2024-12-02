// Verificação do Capacitor para funcionalidades nativas
let triggerHapticFeedback = function (style = 'Medium') {
    try {
        if (typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
            const { Haptics, ImpactStyle } = window.Capacitor.Plugins;

            const hapticStyle = ImpactStyle && ImpactStyle[style] ? ImpactStyle[style] : 'Medium';
            Haptics.impact({ style: hapticStyle })
                .then(() => console.log('Haptics executado com sucesso.'))
                .catch(err => console.error('Erro ao executar o Haptics:', err));
        } else {
            console.log('Haptics não disponível.');
        }
    } catch (error) {
        console.error('Erro ao executar o Haptic Feedback:', error);
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
        this.setupGyroscope();

        // Configuração do Timer
        this.startTime = this.time.now; // Armazena o tempo inicial
        this.timer = 0; // Inicializa o contador de tempo
        this.collisionCooldown = false; // Controle para colisões frequentes
    },

    setupGame: function () {
        // Configuração inicial
        this.add.sprite(0, 0, 'screen-bg');
        this.add.sprite(0, 0, 'panel');
        this.totalTimer = 0;
        this.level = 1;
        this.maxLevels = 5;
        this.movementForce = 5; // Ajuste da força de movimento
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
    managePause: function () {
        this.game.paused = true;
        const pausedText = this.add.text(Ball._WIDTH * 0.5, Ball._HEIGHT * 0.5, "Game paused,\ntap anywhere to continue.", this.fontMessage);
        pausedText.anchor.set(0.5);
        this.input.onDown.add(function () {
            pausedText.destroy();
            this.game.paused = false;
        }, this);
    },
    manageAudio: function () {
        this.audioStatus = !this.audioStatus;
        this.audioButton.animations.play(this.audioStatus);
        if (!this.audioStatus) {
            this.bounceSound.stop(); // Para o som se estiver tocando
        }
    },

    setupGyroscope: function () {
        const self = this;

        // Variáveis para armazenar a posição inicial do celular
        this.initialGamma = null;
        this.initialBeta = null;

        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        self.configureGyroscope();
                    } else {
                        console.log('Permissão negada para o uso do giroscópio.');
                    }
                })
                .catch(console.error);
        } else {
            this.configureGyroscope(); // Giroscópio disponível sem permissão
        }
    },

    configureGyroscope: function () {
        const self = this;
        const sensitivity = 0.2; // Ajuste de sensibilidade do giroscópio

        if (typeof window.DeviceOrientationEvent !== 'undefined') {
            window.addEventListener('deviceorientation', function (event) {
                const gamma = event.gamma; // Inclinação esquerda-direita (X)
                const beta = event.beta; // Inclinação frente-trás (Y)

                // Configura a posição inicial do celular
                if (self.initialGamma === null || self.initialBeta === null) {
                    self.initialGamma = gamma;
                    self.initialBeta = beta;
                }

                // Calcula o deslocamento relativo à posição inicial
                const deltaX = gamma - self.initialGamma;
                const deltaY = beta - self.initialBeta;

                // Atualiza a velocidade da bola com base no deslocamento
                if (deltaX && deltaY) {
                    self.ball.body.velocity.x += deltaX * self.movementForce * sensitivity;
                    self.ball.body.velocity.y += deltaY * self.movementForce * sensitivity;
                }
            });
        } else {
            console.log('Giroscópio não disponível.');
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

    update: function () {
        // Calcula o tempo decorrido
        const elapsedTime = Math.floor((this.time.now - this.startTime) / 1000);

        // Atualiza o texto do temporizador apenas se o tempo mudar
        if (elapsedTime !== this.timer) {
            this.timer = elapsedTime;
            this.timerText.setText("Time: " + this.timer);
            this.totalTimeText.setText("Total time: " + (this.totalTimer + this.timer));
        }

        // Limitação de velocidade da bola
        this.ball.body.velocity.x = Phaser.Math.clamp(this.ball.body.velocity.x, -50, 50);
        this.ball.body.velocity.y = Phaser.Math.clamp(this.ball.body.velocity.y, -50, 50);

        // Detecta colisões
        this.physics.arcade.collide(this.ball, this.borderGroup, this.wallCollision, null, this);
        this.physics.arcade.collide(this.ball, this.levels[this.level - 1], this.wallCollision, null, this);
        this.physics.arcade.overlap(this.ball, this.hole, this.finishLevel, null, this);
    },
    blinkTimer: function () {
        const originalStyle = this.timerText.style.fill; // Armazena a cor original do timer
        this.timerText.setStyle({ fill: '#ff0000' }); // Define o timer para vermelho

        // Restaura o estilo original após 500ms
        this.time.events.add(Phaser.Timer.HALF, () => {
            this.timerText.setStyle({ fill: originalStyle });
        });
    },

    wallCollision: function () {
        if (this.collisionCooldown) return;

        this.collisionCooldown = true;
        setTimeout(() => {
            this.collisionCooldown = false;
        }, 100);

        try {
            if (this.audioStatus && this.bounceSound && !this.bounceSound.isPlaying) {
                this.bounceSound.play();
            }

            triggerHapticFeedback('Heavy'); // Garante estilo de impacto
            // Incrementa o tempo em 0.5 segundos ao colidir
            this.startTime -= 500; // Subtrai 500ms do tempo inicial para adicionar 0.5s ao tempo decorrido
            // Faz o timer piscar em vermelho
            this.blinkTimer();
        } catch (error) {
            console.error('Erro em wallCollision:', error);
        }
    },

    finishLevel: function () {
        if (this.level >= this.maxLevels) {
            // Fim do jogo
            this.totalTimer += this.timer;
            alert('Congratulations, game completed!\nTotal time of play: ' + this.totalTimer + ' seconds!');
            this.game.state.start('MainMenu');
        } else {
            // Conclui o nível atual e reinicia para o próximo
            alert('Congratulations, level ' + this.level + ' completed!');

            this.totalTimer += this.timer; // Acumula o tempo total
            this.timer = 0; // Reinicia o temporizador para o próximo nível
            this.startTime = this.time.now; // Reinicia o tempo inicial

            this.level++;
            this.timerText.setText("Time: " + this.timer);
            this.totalTimeText.setText("Total time: " + this.totalTimer);
            this.levelText.setText("Level: " + this.level + " / " + this.maxLevels);

            // Reseta a posição e velocidade
            this.ball.body.x = this.ballStartPos.x;
            this.ball.body.y = this.ballStartPos.y;
            this.ball.body.velocity.x = 0;
            this.ball.body.velocity.y = 0;

            this.showLevel(); // Exibe o próximo nível
        }
    }
};