// src/js/roomDisplay.js

export class RoomDisplay {
  constructor(messageCardSelector) {
    this.messageCardSelector = messageCardSelector;
  }

  displayRoomInfo(roomData) {
    let htmlContent = `
      <h5>遊戲狀態：</h5>
      <ul>
        <li>遊戲階段：${roomData.gameState.gameRound}</li>
        <li>股票階段：${roomData.gameState.stockRound}</li>
        <li>房屋階段：${roomData.gameState.houseRound}</li>
        <li>保險數量：${roomData.gameState.insurances}</li>
        <li>目前玩家：${roomData.gameState.currentPlayer}</li>
        <li>骰子點數：${roomData.gameState.diceRoll}</li>
        <li>卡片名稱：${roomData.gameState.card}</li>
      </ul>
      <h5>玩家資訊：</h5>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>玩家編號</th>
            <th>加入代號</th>
            <th>玩家狀態</th>
            <th>骰子類型</th>
            <th>骰子狀態</th>
            <th>骰子點數</th>
          </tr>
        </thead>
        <tbody>
    `;

    const players = roomData.players;

    for (const playerId in players) {
      if (players.hasOwnProperty(playerId)) {
        const player = players[playerId];
        const joinedAt =
          player.joinedAt === 0
            ? '未加入'
            : new Date(player.joinedAt * 1000).toLocaleString();
        const status =
          player.joinedAt === 0
            ? "<span class='badge bg-secondary'>未加入</span>"
            : "<span class='badge bg-success'>已加入</span>";

        htmlContent += `
          <tr>
            <td>${playerId}</td>
            <td>${player.password}</td>
            <td>${status}</td>
            <td>${player.diceType}</td>
            <td>${player.rollStatus}</td>
            <td>${player.currentDiceValue}</td>
          </tr>
        `;
      }
    }

    htmlContent += `
        </tbody>
      </table>
    `;

    $(this.messageCardSelector).html(htmlContent);

    this.updateSelects(roomData);
  }

  updateSelects(roomData) {
    this.setSelectValue(
      '#game-round-select',
      roomData.gameState.gameRound,
      '回合'
    );
    this.setSelectValue(
      '#stock-round-select',
      roomData.gameState.stockRound,
      '階段'
    );
    this.setSelectValue(
      '#house-round-select',
      roomData.gameState.houseRound,
      '階段'
    );
    this.setInsuranceSelectValue(
      '#insurance-round-select',
      roomData.gameState.insurances
    );

    const remainingInsurances = roomData.gameState.insurances;
    $('#buyInsuranceModal .modal-body .form-label').text(
      `目前剩餘 ${remainingInsurances} 張保險卡可以購買。`
    );

    this.updatePlayerSelect(roomData);
  }

  setSelectValue(selectId, value, stageType) {
    const $select = $(selectId);
    let found = false;

    $select.val(value);
    if ($select.val() === String(value)) {
      found = true;
    }

    // if (!found) {
    //   console.warn(`Select ${selectId} 中未找到匹配的選項值：${value}`);
    // }
  }

  setInsuranceSelectValue(selectId, insuranceCount) {
    const $select = $(selectId);
    let found = false;

    $select.find('option').each(function () {
      const optionText = $(this).text();
      const parsedValue = this.parseInsuranceValue(optionText);
      if (parsedValue === insuranceCount) {
        $select.val($(this).val());
        found = true;
        return false;
      }
    });

    // if (!found) {
    //   console.warn(
    //     `Select ${selectId} 中未找到匹配的保險數量選項：${insuranceCount}`
    //   );
    // }
  }

  parseInsuranceValue(text) {
    const regex = /目前還有\s*(-?\d+)\s*張保險卡/;
    const match = text.match(regex);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }

    if (text.includes('沒有保險卡可以買囉')) {
      return 0;
    }

    return null;
  }

  updatePlayerSelect(roomData) {
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
