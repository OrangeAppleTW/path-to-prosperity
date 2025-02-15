// src/js/settlementHandler.js
import { ref, runTransaction, onValue } from 'firebase/database';
import { Modal } from 'bootstrap';

export class SettlementHandler {
  constructor(db, roomId, stocksData, housesData, stockRounds, houseRounds) {
    this.db = db;
    this.roomId = roomId;
    this.stocksData = stocksData;
    this.housesData = housesData;
    this.stockRounds = stockRounds;
    this.houseRounds = houseRounds;
    this.settlementModal = new Modal(
      document.getElementById('settlementModal')
    );
    this.currentRoomData = null;
    this.initializeEventListeners();
    this.initializeRoomListener();
  }

  initializeRoomListener() {
    const roomRef = ref(this.db, `rooms/${this.roomId}`);

    onValue(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          console.error('教室資料不存在');
          return;
        }

        this.currentRoomData = snapshot.val();
        const players = this.currentRoomData.players;
        const playersArray = []; // 用於計算排名

        // 更新表格中的動態數據
        for (const playerId in players) {
          if (players.hasOwnProperty(playerId)) {
            const player = players[playerId];
            const stocksNetWorth = this.calculateStocksNetWorth(player);
            const housesNetWorth = this.calculateHousesNetWorth(player);
            const cash = player.cash || 0;
            const savings = player.savings || 0;
            const totalAssets =
              cash + savings + stocksNetWorth + housesNetWorth;

            // 儲存計算結果用於排名
            playersArray.push({ playerId, totalAssets });

            // 更新玩家狀態
            const status =
              player.joinedAt === 0
                ? "<span class='badge bg-secondary'>未加入</span>"
                : "<span class='badge bg-success'>已加入</span>";
            $(`tr[data-player-id="${playerId}"] td:first-child`).html(status);

            // 更新各項資產數據

            $(`tr[data-player-id="${playerId}"] td:nth-child(5)`).text(savings);
            $(`tr[data-player-id="${playerId}"] td:nth-child(6)`).text(
              stocksNetWorth
            );
            $(`tr[data-player-id="${playerId}"] td:nth-child(7)`).text(
              housesNetWorth
            );
            $(`tr[data-player-id="${playerId}"] td:nth-child(8)`).text(
              totalAssets
            );
          }
        }

        // 計算並更新排名
        playersArray.sort((a, b) => b.totalAssets - a.totalAssets);
        playersArray.forEach((playerData, index) => {
          const rank = index + 1;
          this.currentRoomData.players[playerData.playerId].assetsRank = rank;
          $(`tr[data-player-id="${playerData.playerId}"] td:nth-child(9)`).text(
            rank
          );
        });
      },
      (error) => {
        console.error('監聽教室資料時出錯:', error);
      }
    );
  }

  initializeEventListeners() {
    $('#settlement-button').click(() => this.handleSettlementClick());
  }

  calculateHousePriceChange() {
    const houseRound = this.currentRoomData?.gameState?.houseRound || 0;
    const houseRoundData = this.houseRounds[houseRound];
    return houseRoundData ? houseRoundData.priceChange : 0;
  }

  calculateStocksNetWorth(player) {
    let stocksNetWorth = 0;
    if (player.properties && typeof player.properties === 'object') {
      Object.entries(player.properties)
        .filter(
          ([_, property]) =>
            property.type === 'stock' && !property.soldAt && !property.usedAt
        )
        .forEach(([_, property]) => {
          const stockData = this.stocksData.find(
            (s) => 'stock-' + s.id.substring(1) === property.property
          );
          if (stockData) {
            const stockRound = this.currentRoomData?.gameState?.stockRound || 0;
            const stockRoundData = this.stockRounds[stockRound];
            const priceChange = stockRoundData ? stockRoundData.priceChange : 0;
            const currentPrice = stockData.price + priceChange;
            stocksNetWorth += currentPrice;
          }
        });
    }
    return stocksNetWorth;
  }

  calculateHousesNetWorth(player) {
    let housesNetWorth = 0;
    const housePriceChange = this.calculateHousePriceChange();

    if (player.properties && typeof player.properties === 'object') {
      Object.entries(player.properties)
        .filter(
          ([_, property]) =>
            property.type === 'house' && !property.soldAt && !property.usedAt
        )
        .forEach(([_, property]) => {
          const houseData = this.housesData.find(
            (h) => 'house-' + h.id.substring(1) === property.property
          );
          if (houseData) {
            const currentPrice = houseData.price + housePriceChange;
            housesNetWorth += currentPrice;
          }
        });
    }
    return housesNetWorth;
  }

  handleSettlementClick() {
    const players = this.currentRoomData.players;
    const playersArray = [];

    // 計算每個玩家的總資產和排名
    for (const playerId in players) {
      if (players.hasOwnProperty(playerId)) {
        const player = players[playerId];
        const stocksNetWorth = this.calculateStocksNetWorth(player);
        const housesNetWorth = this.calculateHousesNetWorth(player);
        const cash = player.cash || 0;
        const savings = player.savings || 0;
        const totalAssets = cash + savings + stocksNetWorth + housesNetWorth;

        player.stocksNetWorth = stocksNetWorth;
        player.housesNetWorth = housesNetWorth;
        player.totalAssets = totalAssets;

        playersArray.push({ playerId, totalAssets });
      }
    }

    // 按總資產降序排序並設定資產排名
    playersArray.sort((a, b) => b.totalAssets - a.totalAssets);
    playersArray.forEach((playerData, index) => {
      players[playerData.playerId].assetsRank = index + 1;
    });

    // 生成表格內容
    let htmlContent = `
      <div class="table-responsive">
        <table class="table table-bordered m-0">
          <thead class="table-secondary">
            <tr style="height: 48px" class="align-middle text-center">
              <th class="align-middle">玩家狀態</th>
              <th class="align-middle">玩家名稱</th>
              <th class="align-middle">邀請代號</th>
              <th class="align-middle">現金資產</th>
              <th class="align-middle">儲蓄資產</th>
              <th class="align-middle">股票資產</th>
              <th class="align-middle">房屋資產</th>
              <th class="align-middle">資產總計</th>
              <th class="align-middle">資產排名</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const playerId in players) {
      if (players.hasOwnProperty(playerId)) {
        const player = players[playerId];
        const status =
          player.joinedAt === 0
            ? "<span class='badge bg-secondary'>未加入</span>"
            : "<span class='badge bg-success'>已加入</span>";

        const stocksNetWorth = player.stocksNetWorth;
        const housesNetWorth = player.housesNetWorth;
        const totalAssets = player.totalAssets;
        const assetsRank = player.assetsRank;
        const cash = player.cash || 0;

        htmlContent += `
          <tr data-player-id="${playerId}" style="height: 48px" class="align-middle text-center">
            <td class="col-1 align-middle">${status}</td>
            <td class="col-1 align-middle">玩家 ${playerId}</td>
            <td class="col-1 align-middle">${player.password}</td>
            <td class="col-2 align-middle">
              <input type="number" min=0 class="form-control cash-input" step="50" data-player-id="${playerId}" value="${cash}">
            </td>
            <td class="col-1 align-middle">${player.savings}</td>
            <td class="col-1 align-middle">${stocksNetWorth}</td>
            <td class="col-1 align-middle">${housesNetWorth}</td>
            <td class="col-1 align-middle total-assets" data-player-id="${playerId}">${totalAssets}</td>
            <td class="col-1 align-middle assets-rank" data-player-id="${playerId}">${assetsRank}</td>
          </tr>
        `;
      }
    }

    htmlContent += `
          </tbody>
        </table>
      </div>
    `;

    $('#room-info-list').html(htmlContent);
    this.settlementModal.show();

    // 添加事件監聽器，當輸入框的值變化時更新資料庫和界面
    $('#room-info-list .cash-input').on('input', (event) => {
      const input = event.target;
      const playerId = $(input).data('player-id');
      const newCashValue = parseFloat(input.value) || 0;

      // 更新資料庫中的 player.cash
      this.updatePlayerCash(playerId, newCashValue);

      // 更新 currentRoomData 中的 player.cash
      if (this.currentRoomData && this.currentRoomData.players[playerId]) {
        this.currentRoomData.players[playerId].cash = newCashValue;
      }

      // 重新計算資產和排名並更新表格
      this.updateAssetsAndRank();
    });
  }

  updatePlayerCash(playerId, newCashValue) {
    const roomRef = ref(this.db, `rooms/${this.roomId}`);
    runTransaction(roomRef, (currentData) => {
      if (currentData && currentData.players && currentData.players[playerId]) {
        currentData.players[playerId].cash = newCashValue;
      }
      return currentData;
    });
  }

  updateAssetsAndRank() {
    const players = this.currentRoomData.players;
    const playersArray = [];

    for (const playerId in players) {
      if (players.hasOwnProperty(playerId)) {
        const player = players[playerId];
        const stocksNetWorth = this.calculateStocksNetWorth(player);
        const housesNetWorth = this.calculateHousesNetWorth(player);
        const cash = player.cash || 0;
        const savings = player.savings || 0;
        const totalAssets = cash + savings + stocksNetWorth + housesNetWorth;

        player.totalAssets = totalAssets;

        playersArray.push({ playerId, totalAssets });
      }
    }

    // 按總資產降序排序並設定資產排名
    playersArray.sort((a, b) => b.totalAssets - a.totalAssets);
    playersArray.forEach((playerData, index) => {
      players[playerData.playerId].assetsRank = index + 1;
    });

    // 更新表格中的總資產和資產排名
    this.updateModalTable();
  }

  updateModalTable() {
    const players = this.currentRoomData.players;

    for (const playerId in players) {
      if (players.hasOwnProperty(playerId)) {
        const player = players[playerId];

        // 更新總資產儲存格
        $(`.total-assets[data-player-id="${playerId}"]`).text(
          player.totalAssets
        );

        // 更新資產排名儲存格
        $(`.assets-rank[data-player-id="${playerId}"]`).text(player.assetsRank);
      }
    }
  }
}
