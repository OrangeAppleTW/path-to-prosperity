// GameRoundSelector.js
export class GameRoundSelector {
  constructor(config) {
    this.sounds = config.sounds;
    this.gameRounds = config.gameRounds;
    this.updateGameState = config.updateGameState;
    this.isDropdownOpen = false;
    this.init();
  }

  init() {
    const gameRoundSelect = $('#game-round-select');

    $.each(this.gameRounds, (index, round) => {
      gameRoundSelect.append(
        $('<option>', {
          value: index,
          text: `${round.icon} 第 ${index} 回合${
            round.event ? '：' + round.event : ''
          }`,
        })
      );
    });

    gameRoundSelect.val(1);

    this.bindEvents(gameRoundSelect);
  }

  bindEvents(select) {
    select.on('mousedown touchstart', () => {
      this.sounds.selectGameStageSound.currentTime = 0;
      this.isDropdownOpen = true;
    });

    select.on('change', () => {
      if (this.isDropdownOpen) {
        this.sounds.selectGameStageSound.play();
        this.isDropdownOpen = false;
        const selectedValue = select.val();
        const gameRoundValue = this.parseRoundValue(selectedValue);

        if (gameRoundValue !== null) {
          this.updateGameState('gameRound', gameRoundValue);
        }
      }
    });
  }

  parseRoundValue(value) {
    return parseInt(value, 10);
  }
}
