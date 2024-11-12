// src/js/dividendCounter.js
import { ref, onValue } from 'firebase/database';
import $ from 'jquery';
import Modal from 'bootstrap/js/dist/modal';

export class DividendCounter {
  constructor(rtdb, roomId, stocksData, stockRounds) {
    this.rtdb = rtdb;
    this.roomId = roomId;
    this.stocksData = stocksData;
    this.stockRounds = stockRounds;
    this.modal = new Modal(document.getElementById('dividendCounterModal'));
    this.currentRoomData = null;

    this.initializeListeners();
  }

  initializeListeners() {
    // 監聽房間資料變更
    const roomRef = ref(this.rtdb, `rooms/${this.roomId}`);
    onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        this.currentRoomData = snapshot.val();
      }
    });

    // 綁定按鈕點擊事件
    $('#count-dividend-button').click(() => {
      this.showModal();
    });
  }

  showModal() {
    this.updatePlayerSelect();
    this.renderDividendList();
    this.modal.show();
  }

  updatePlayerSelect() {
    const $playerSelect = $('#dividend-counter-player-select');
    $playerSelect.empty();

    if (this.currentRoomData?.players) {
      Object.entries(this.currentRoomData.players)
        .filter(([_, playerData]) => playerData.joinedAt > 0)
        .sort(([idA], [idB]) => idA.localeCompare(idB))
        .forEach(([playerId, playerData]) => {
          $playerSelect.append(
            `<option value="${playerId}">玩家：${
              playerData.name || playerId
            }</option>`
          );
        });
    }

    // 監聽玩家選擇變更
    $playerSelect.off('change').on('change', () => this.renderDividendList());
  }

  calculateStockPriceChange() {
    const stockRound = this.currentRoomData?.gameState?.stockRound || 0;
    const stockRoundData = this.stockRounds[stockRound];
    return stockRoundData ? stockRoundData.priceChange : 0;
  }

  calculateStockDividendChange() {
    const stockRound = this.currentRoomData?.gameState?.stockRound || 0;
    const stockRoundData = this.stockRounds[stockRound];
    return stockRoundData ? stockRoundData.dividendChange : 0;
  }

  formatDateTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return timeStr;
  }

  renderDividendList() {
    const selectedPlayerId = $('#dividend-counter-player-select').val();
    if (
      !selectedPlayerId ||
      !this.currentRoomData?.players?.[selectedPlayerId]
    ) {
      $('#dividend-counter-list').html('');
      $('#total-dividend').text('');
      return;
    }

    const playerData = this.currentRoomData.players[selectedPlayerId];
    const stockPriceChange = this.calculateStockPriceChange();
    const stockDividendChange = this.calculateStockDividendChange();
    let totalDividend = 0;

    let html = `
      <div class="table-responsive">
        <table class="table table-bordered">
          <thead class="table-secondary">
            <tr style="height: 48px" class="align-middle text-center">
              <th class="align-middle">資產名稱</th>
              <th class="align-middle">購入時間</th>
              <th class="align-middle">購入價格</th>
              <th class="align-middle">目前價格</th>
              <th class="align-middle">目前股息</th>
            </tr>
          </thead>
          <tbody>
    `;

    let stockNum = 0;

    if (playerData.properties) {
      Object.entries(playerData.properties)
        .filter(
          ([_, property]) =>
            property.type === 'stock' && !property.soldAt && !property.usedAt
        )
        .forEach(([_, property]) => {
          const stockData = this.stocksData.find(
            (s) => 'stock-' + s.id.substring(1) === property.property
          );

          if (stockData) {
            stockNum += 1;
            const currentPrice = stockData.price + stockPriceChange;
            const currentDividend =
              stockData.dividend + stockDividendChange > 0
                ? stockData.dividend + stockDividendChange
                : 0;
            totalDividend += currentDividend;
            const purchaseTime = this.formatDateTime(property.buyAt);

            html += `
              <tr style="height: 48px">
                <td class="align-middle text-center">${stockData.name}</td>
                <td class="align-middle text-center">${purchaseTime}</td>
                <td class="align-middle text-end">${property.buyPrice} 元</td>
                <td class="align-middle text-end">${currentPrice} 元</td>
                <td class="align-middle text-end">${currentDividend} 元</td>
              </tr>
            `;
          }
        });
    }

    if (stockNum < 1) {
      html += `
        <tr style="height: 48px">
            <td class="align-middle text-center">-</td>
            <td class="align-middle text-center">-</td>
            <td class="align-middle text-center">-</td>
            <td class="align-middle text-center">-</td>
            <td class="align-middle text-center">-</td>
        </tr>
        `;
    }

    html += `
          </tbody>
        </table>
      </div>
    `;

    $('#dividend-counter-list').html(html);
    $('#total-dividend').html(
      `加總股息收入後，這一回合可以領取 <span class="text-danger">${totalDividend}</span> 元。`
    );
  }
}
