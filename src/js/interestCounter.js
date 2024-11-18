// src/js/rentCounter.js
import { ref, onValue } from 'firebase/database';
import $ from 'jquery';
import Modal from 'bootstrap/js/dist/modal';

export class InterestCounter {
  constructor(db, roomId) {
    this.db = db;
    this.roomId = roomId;
    this.modal = new Modal(document.getElementById('interestCounterModal'));
    this.currentRoomData = null;
    this.initializeListeners();
  }

  initializeListeners() {
    const roomRef = ref(this.db, `rooms/${this.roomId}`);
    onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        this.currentRoomData = snapshot.val();
      }
    });
    $('#count-interest-button').click(() => {
      this.showModal();
    });
  }

  showModal() {
    this.renderInterestList();
    this.modal.show();
  }
  // !selectedPlayerId ||
  //       !this.currentRoomData?.players?.[selectedPlayerId]
  renderInterestList() {
    let html = `
      <div class="table-responsive">
        <table class="table table-bordered m-0">
          <thead class="table-secondary">
            <tr style="height: 48px" class="align-middle text-center">
              <th class="align-middle">玩家名稱</th>
              <th class="align-middle">儲蓄金額</th>
              <th class="align-middle">目前利率</th>
              <th class="align-middle">目前利息</th>
            </tr>
          </thead>
          <tbody>
    `;

    Object.entries(this.currentRoomData.players)
      .filter(([_, player]) => player.joinedAt > 0)
      .forEach(([playerId, player]) => {
        html += `
              <tr style="height: 48px">
                <td class="align-middle text-center">玩家 ${playerId}</td>
                <td class="align-middle text-center">${player.savings}</td>
                <td class="align-middle text-center">10%</td>
                <td class="align-middle text-center">${
                  player.savings * 0.1
                }</td>
              </tr>
            `;
      });

    html += `
          </tbody>
        </table>
      </div>
    `;

    $('#interest-counter-list').html(html);
  }
}
