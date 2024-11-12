// StockRoundSelector.js
export class StockRoundSelector {
  constructor(config) {
    this.sounds = config.sounds;
    this.stockRounds = config.stockRounds;
    this.updateGameState = config.updateGameState;
    this.isDropdownOpen = false;
    this.init();
  }

  init() {
    const stockRoundSelect = $('#stock-round-select');
    const sortedStockRounds = Object.keys(this.stockRounds)
      .map((e) => Number(e))
      .sort((a, b) => b - a);

    $.each(sortedStockRounds, (_, round) => {
      stockRoundSelect.append($('<option>', { value: round, text: round }));
    });

    stockRoundSelect.val('0');

    this.bindEvents(stockRoundSelect);
  }

  bindEvents(select) {
    select.on('mousedown touchstart', () => {
      this.sounds.selectStockStageSound.currentTime = 0;
      this.isDropdownOpen = true;
    });

    select.on('change', () => {
      if (this.isDropdownOpen) {
        this.sounds.selectStockStageSound.play();
        this.isDropdownOpen = false;
        const selectedValue = select.val();
        const stockRoundValue = this.parseRoundValue(selectedValue);

        if (stockRoundValue !== null) {
          this.updateGameState('stockRound', stockRoundValue);
        }
      }
    });
  }

  parseRoundValue(value) {
    return parseInt(value, 10);
  }
}
