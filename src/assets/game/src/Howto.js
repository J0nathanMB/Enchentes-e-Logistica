Ball.Howto = function (game) { };

Ball.Howto.prototype = {
    create: function () {

        this.input.maxPointers = 1; // Limita para um único toque por vez
        this.input.addPointer(); // Adiciona suporte para toque
        this.input.mouse.enabled = true; // Habilita entrada de mouse para simular clique
        this.add.sprite(0, 0, 'screen-howtoplay');

        // Detecta um clique ou toque em qualquer lugar da tela
        this.input.onDown.addOnce(this.startGame, this);

        // Garantir que o toque também funciona no ambiente nativo
        this.input.onTap.addOnce(this.startGame, this); // Compatível com toques em dispositivos móveis
    },

    startGame: function () {
        this.game.state.start('Game');
    }
};