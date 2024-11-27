import { ref, set, get } from 'firebase/database';
import { Modal } from 'bootstrap';
import { auth } from './common';

export class SettingsHandler {
  constructor(db, roomId) {
    this.db = db;
    this.roomId = roomId;
    this.settingsModal = new Modal(document.getElementById('settingsModal'));

    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      settingsButton.addEventListener('click', async () => {
        await this.loadSettings();
        this.settingsModal.show();
      });
    }
  }

  async loadSettings() {
    const settingsSection = document.getElementById('settings-section');
    if (!settingsSection) return;

    settingsSection.innerHTML = `
      <div class="settings-content col-12 d-flex">
        <button id="back-button" type="button" class="btn btn-lg btn-success text-light me-3">
          返回大廳
        </button>
        <button id="reset-button" type="button" class="btn btn-lg btn-danger text-light">
          重新遊玩
        </button>
      </div>
    `;

    // 綁定返回按鈕事件
    const backButton = document.getElementById('back-button');
    if (backButton) {
      backButton.addEventListener('click', () => {
        this.settingsModal.hide();
        window.location.href = './teacher-lobby.html';
      });
    }

    // 重置按鈕事件
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
      resetButton.addEventListener('click', async () => {
        if (
          confirm(
            '確定要重置遊戲狀態嗎？所有玩家的遊戲進度將會重置，但玩家資格會保留。'
          )
        ) {
          try {
            await this.resetRoom();
          } catch (error) {
            console.error('重置遊戲時發生錯誤:', error);
            alert('重置遊戲失敗，請稍後再試。');
          }
        }
      });
    }
  }

  async resetRoom() {
    const user = auth.currentUser;
    if (!user) {
      alert('請先登入。');
      return false;
    }

    let roomCode = prompt('請輸入房間代碼以確認重置')?.trim();
    if (!roomCode) {
      alert('請輸入房間代碼。');
      return false;
    }

    try {
      // 檢查房間是否存在
      const roomRef = ref(this.db, `rooms/${this.roomId}`);
      console.log(this.roomId);
      const roomSnapshot = await get(roomRef);
      if (!roomSnapshot.exists()) {
        alert('房間不存在。');
        return false;
      }
      const roomData = roomSnapshot.val();
      console.log(roomData.password);

      // 檢查輸入的房間代碼是否正確
      if (roomCode !== this.roomId + roomData.password) {
        alert('房間代碼不正確。');
        return false;
      }
      const existingPlayers = roomData.players || {};

      const newRoomData = {
        createdAt: roomData.createdAt,
        expiredAt: roomData.expiredAt,
        password: roomData.password,
        gameState: {
          currentPlayer: 1,
          card: 'stock-1',
          diceRoll: 1,
          gameRound: 1,
          stockRound: 0,
          houseRound: 0,
          insurances: 10,
        },
        players: {},
      };

      Object.keys(existingPlayers).forEach((playerId) => {
        const player = existingPlayers[playerId];
        newRoomData.players[playerId] = {
          password: player.password,
          joinedAt: player.joinedAt,
          diceType: 1,
          rollStatus: 'idle',
          animationFinishedRemind: false,
          currentDiceValue: 0,
          lastDiceValue: 0,
          savings: 0,
          cash: 0,
          properties: {},
        };
      });

      await set(roomRef, newRoomData);
      alert('遊戲狀態已重置成功！');
      this.settingsModal.hide();
      window.location.reload();
      return true;
    } catch (error) {
      console.error('重置房間時發生錯誤:', error);
      alert('重置失敗，請稍後再試。');
      return false;
    }
  }
}
