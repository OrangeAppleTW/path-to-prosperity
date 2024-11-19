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
            // 驗證邀請碼
            const isValid = await this.validateCoupon();
            if (!isValid) {
              return;
            }
          } catch (error) {
            console.error('重置遊戲時發生錯誤:', error);
            alert('重置遊戲失敗，請稍後再試。');
          }
        }
      });
    }
  }

  async validateCoupon() {
    const user = auth.currentUser;
    if (!user) {
      alert('請先登入。');
      return false;
    }

    let couponCode = prompt('請輸入邀請碼以確認重置權限')?.trim();
    if (!couponCode) {
      alert('請輸入邀請碼。');
      return false;
    }

    try {
      // 先獲取房間資料，檢查 owner
      const roomRef = ref(this.db, `rooms/${this.roomId}`);
      const roomSnapshot = await get(roomRef);
      if (!roomSnapshot.exists()) {
        alert('房間不存在。');
        return false;
      }
      const roomData = roomSnapshot.val();

      // 檢查輸入的 coupon 是否與房間的 owner 相同
      if (couponCode !== roomData.owner) {
        alert('您沒有權限重置此房間。');
        return false;
      }

      // 驗證邀請碼是否有效
      const couponRef = ref(this.db, `coupons/${couponCode}`);
      const couponSnapshot = await get(couponRef);
      if (!couponSnapshot.exists()) {
        alert('邀請碼無效或不存在。');
        return false;
      }

      const couponData = couponSnapshot.val();
      const currentTime = Date.now();
      if (currentTime >= couponData.expiredAt) {
        alert('邀請碼已過期。');
        return false;
      }

      // 驗證成功後，重置房間狀態
      if (couponCode === roomData.owner) {
        // 保存現有的玩家資料
        const existingPlayers = roomData.players || {};

        // 建立新的房間數據，保留原本的 createdAt 和 owner
        const newRoomData = {
          createdAt: roomData.createdAt,
          owner: roomData.owner,
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

        // 重新初始化每個玩家的狀態
        Object.keys(existingPlayers).forEach((playerId) => {
          const player = existingPlayers[playerId];
          newRoomData.players[playerId] = {
            // 保留原有的密碼和加入狀態
            password: player.password,
            joinedAt: player.joinedAt, // 保留原本的加入時間
            // 重置遊戲相關狀態
            diceType: 1,
            rollStatus: player.joinedAt === 0 ? 'idle' : 'connecting',
            animationFinishedRemind: false,
            currentDiceValue: 0,
            lastDiceValue: 0,
            savings: 0,
            cash: 0,
            properties: {},
          };
        });

        // 更新房間數據
        await set(roomRef, newRoomData);
        alert('遊戲狀態已重置成功！');
        this.settingsModal.hide();
        window.location.reload(); // 重新載入頁面以更新狀態
        return true;
      }
    } catch (error) {
      console.error('驗證邀請碼時發生錯誤:', error);
      alert('驗證失敗，請先返回大廳重新綁定邀請碼，再進行此操作。');
      return false;
    }
  }
}
