// HouseRoundSelector.js
export class HouseRoundSelector {
  constructor(config) {
    this.sounds = config.sounds;
    this.houseRounds = config.houseRounds;
    this.updateGameState = config.updateGameState;
    this.isDropdownOpen = false;
    this.init();
  }

  init() {
    const houseRoundSelect = $('#house-round-select');
    const sortedHouseRounds = Object.keys(this.houseRounds)
      .map((e) => Number(e))
      .sort((a, b) => b - a);

    $.each(sortedHouseRounds, (_, round) => {
      houseRoundSelect.append($('<option>', { value: round, text: round }));
    });

    houseRoundSelect.val('0');

    this.bindEvents(houseRoundSelect);
  }

  bindEvents(select) {
    select.on('mousedown touchstart', () => {
      this.sounds.selectHouseStageSound.currentTime = 0;
      this.isDropdownOpen = true;
    });

    select.on('change', () => {
      if (this.isDropdownOpen) {
        this.sounds.selectHouseStageSound.play();
        this.isDropdownOpen = false;
        const selectedValue = select.val();
        const houseRoundValue = this.parseRoundValue(selectedValue);

        if (houseRoundValue !== null) {
          this.updateGameState('houseRound', houseRoundValue);
        }
      }
    });
  }

  parseRoundValue(value) {
    return parseInt(value, 10);
  }
}
