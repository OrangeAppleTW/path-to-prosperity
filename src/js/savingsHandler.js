// src/js/insuranceHandler.js
import { ref, runTransaction } from 'firebase/database';
import { Modal } from 'bootstrap';

export class SavingsHandler {
  constructor(db, roomId) {
    this.db = db;
    this.roomId = roomId;
    this.savingsModal = new Modal(document.getElementById('savingsModal'));
    this.currentRoomData = null;
    this.isProcessingPurchase = false;

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    $('#savings-button').click(() => this.handleSavingsClick());
    $('#confirm-savings').click(() => this.handleConfirmSavings());
  }

  setCurrentRoomData(roomData) {
    this.currentRoomData = roomData;
  }

  handleSavingsClick() {
    $('#savingsInput').val(500);
    this.savingsModal.show();
  }

  async handleConfirmSavings() {
    if (this.isProcessingPurchase) return;

    this.isProcessingPurchase = true;

    try {
      if (!this.currentRoomData) {
        throw new Error('無法取得教室資料，請稍後再試。');
      }

      const currentPlayerId = this.currentRoomData.gameState.currentPlayer;
      if (!currentPlayerId || !this.currentRoomData.players[currentPlayerId]) {
        throw new Error('無效的目前玩家！');
      }

      const confirmed = confirm(
        `總共要存入 ${$('#savingsInput').val()} 元，請支付給銀行唷！`
      );

      if (confirmed) {
        const roomRef = ref(this.db, `rooms/${this.roomId}`);
        await runTransaction(roomRef, (currentData) => {
          if (!currentData) return;
          const currentPlayer = currentData.players[currentPlayerId];
          currentPlayer.savings =
            currentPlayer.savings + Number($('#savingsInput').val());
          return currentData;
        });
        this.savingsModal.hide();
        alert('存入成功！');
      }
    } catch (error) {
      console.error('儲蓄時出錯:', error);
      alert(error.message || '儲蓄時出錯，請稍後再試。');
    } finally {
      this.isProcessingPurchase = false;
    }
  }
}
