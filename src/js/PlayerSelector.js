// PlayerSelector.js
export class PlayerSelector {
  constructor(config) {
    this.updateGameState = config.updateGameState;
    this.init();
  }

  init() {
    const playerSelect = $('#player-select');
    this.bindEvents(playerSelect);
  }

  bindEvents(select) {
    select.on('change', () => {
      const selectedPlayer = select.val();
      if (selectedPlayer) {
        this.updateGameState('currentPlayer', selectedPlayer);
      }
    });
  }

  updatePlayerList(roomData) {
    const $playerSelect = $('#player-select');
    const joinedPlayers = Object.keys(roomData.players).filter(
      (playerId) => roomData.players[playerId].joinedAt !== 0
    );

    $playerSelect.empty();
    $playerSelect.append(
      $('<option>', {
        value: '',
        text: '-- 選擇玩家 --',
        disabled: true,
        selected: true,
      })
    );

    joinedPlayers.forEach((playerId) => {
      $playerSelect.append(
        $('<option>', {
          value: playerId,
          text: '玩家：' + playerId,
        })
      );
    });

    const currentPlayer = roomData.gameState.currentPlayer;
    if (currentPlayer && joinedPlayers.includes(currentPlayer)) {
      $playerSelect.val(currentPlayer);
    } else {
      $playerSelect.val('');
    }
  }
}
