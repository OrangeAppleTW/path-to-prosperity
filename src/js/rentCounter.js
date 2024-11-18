// src/js/rentCounter.js
import { ref, onValue } from 'firebase/database';
import $ from 'jquery';
import Modal from 'bootstrap/js/dist/modal';

export class RentCounter {
  constructor(db, roomId, housesData, houseRounds) {
    this.db = db;
    this.roomId = roomId;
    this.housesData = housesData;
    this.houseRounds = houseRounds;
    this.modal = new Modal(document.getElementById('rentCounterModal'));
    this.currentRoomData = null;

    this.initializeListeners();
  }

  initializeListeners() {
    // 監聽房間資料變更
    const roomRef = ref(this.db, `rooms/${this.roomId}`);
    onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        this.currentRoomData = snapshot.val();
      }
    });

    // 綁定按鈕點擊事件
    $('#count-rent-button').click(() => {
      this.showModal();
    });
  }

  showModal() {
    this.updatePlayerSelect();
    this.renderRentList();
    this.modal.show();
  }

  updatePlayerSelect() {
    const $playerSelect = $('#rent-counter-player-select');
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
    $playerSelect.off('change').on('change', () => this.renderRentList());
  }

  calculateHousePriceChange() {
    const houseRound = this.currentRoomData?.gameState?.houseRound || 0;
    const houseRoundData = this.houseRounds[houseRound];
    return houseRoundData ? houseRoundData.priceChange : 0;
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

  renderRentList() {
    const selectedPlayerId = $('#rent-counter-player-select').val();
    if (
      !selectedPlayerId ||
      !this.currentRoomData?.players?.[selectedPlayerId]
    ) {
      $('#rent-counter-list').html('');
      $('#total-rent').text('');
      return;
    }

    const playerData = this.currentRoomData.players[selectedPlayerId];
    const housePriceChange = this.calculateHousePriceChange();
    let totalRent = 0;

    let html = `
      <div class="table-responsive">
        <table class="table table-bordered">
          <thead class="table-secondary">
            <tr style="height: 48px" class="align-middle text-center">
              <th class="align-middle">資產名稱</th>
              <th class="align-middle">購入時間</th>
              <th class="align-middle">購入價格</th>
              <th class="align-middle">目前價格</th>
              <th class="align-middle">目前房租</th>
            </tr>
          </thead>
          <tbody>
    `;

    let houseNum = 0;
    if (playerData.properties) {
      Object.entries(playerData.properties)
        .filter(
          ([_, property]) =>
            property.type === 'house' && !property.soldAt && !property.usedAt
        )
        .forEach(([_, property]) => {
          const houseData = this.housesData.find(
            (h) => 'house-' + h.id.substring(1) === property.property
          );

          if (houseData) {
            houseNum += 1;
            const currentPrice = houseData.price + housePriceChange;
            const currentRent = houseData.rent; // 假設房租為房價的 10%
            totalRent += currentRent;
            const purchaseTime = this.formatDateTime(property.buyAt);

            html += `
              <tr style="height: 48px">
                <td class="align-middle text-center">${houseData.name}</td>
                <td class="align-middle text-center">${purchaseTime}</td>
                <td class="align-middle text-center">${property.buyPrice}</td>
                <td class="align-middle text-center">${currentPrice}</td>
                <td class="align-middle text-center">${currentRent}</td>
              </tr>
            `;
          }
        });
    }

    if (houseNum < 1) {
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

    $('#rent-counter-list').html(html);
    $('#total-rent').html(
      `加總房租收入後，這一回合可以領取 <span class="text-danger">${totalRent}</span> 元。`
    );
  }
}
