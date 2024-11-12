// src/js/insuranceHandler.js
import { ref, runTransaction } from 'firebase/database';
import { Modal } from 'bootstrap';

export class InsuranceHandler {
  constructor(rtdb, roomId) {
    this.rtdb = rtdb;
    this.roomId = roomId;
    this.buyInsuranceModal = new Modal(
      document.getElementById('buyInsuranceModal')
    );
    this.currentRoomData = null;
    this.isProcessingPurchase = false;

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    $('#buy-insurance-button').click(() => this.handleBuyInsuranceClick());
    $('#confirm-buy-insurance').click(() => this.handleConfirmBuyInsurance());
  }

  setCurrentRoomData(roomData) {
    this.currentRoomData = roomData;
  }

  handleBuyInsuranceClick() {
    $('#confirm-buy-insurance').show();
    const insurancesLeft = this.currentRoomData.gameState.insurances;
    if (insurancesLeft <= 0) {
      $('#confirm-buy-insurance').hide();
    }
    this.buyInsuranceModal.show();
  }

  async handleConfirmBuyInsurance() {
    if (this.isProcessingPurchase) return;

    this.isProcessingPurchase = true;

    try {
      if (!this.currentRoomData) {
        throw new Error('無法取得教室資料，請稍後再試。');
      }

      const insurancesLeft = this.currentRoomData.gameState.insurances;
      if (insurancesLeft <= 0) {
        throw new Error('沒有保險卡可以購買！');
      }

      const currentPlayerId = this.currentRoomData.gameState.currentPlayer;
      if (!currentPlayerId || !this.currentRoomData.players[currentPlayerId]) {
        throw new Error('無效的目前玩家！');
      }

      const confirmed = confirm(
        '要購買「保險卡」的話，需支付 500 元，請支付給銀行唷！'
      );

      if (confirmed) {
        const currentPlayer = this.currentRoomData.players[currentPlayerId];
        const properties = currentPlayer.properties || {};
        const propertyIds = Object.keys(properties).map((id) =>
          parseInt(id, 10)
        );
        const maxPropertiesId =
          propertyIds.length > 0 ? Math.max(...propertyIds) : 0;
        const newPropertiesId = maxPropertiesId + 1;

        const roomRef = ref(this.rtdb, `rooms/${this.roomId}`);

        await runTransaction(roomRef, (currentData) => {
          if (!currentData || currentData.gameState.insurances <= 0) return;

          currentData.gameState.insurances -= 1;

          const player = currentData.players[currentPlayerId];
          if (!player.properties) {
            player.properties = {};
          }

          player.properties[newPropertiesId] = {
            type: 'insurance',
            property: 'insurance',
            buyPrice: 500,
            buyAt: Date.now(),
            usedAt: 0,
          };

          return currentData;
        });

        this.buyInsuranceModal.hide();
        alert('購買成功！');
      }
    } catch (error) {
      console.error('購買保險時出錯:', error);
      alert(error.message || '購買保險時出錯，請稍後再試。');
    } finally {
      this.isProcessingPurchase = false;
    }
  }
}
