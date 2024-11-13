// src/js/settingsHandler.js
import { ref, set, runTransaction } from 'firebase/database';
import { Modal } from 'bootstrap';

export class SettingsHandler {
  constructor(rtdb, roomId) {
    this.rtdb = rtdb;
    this.roomId = roomId;

    // 初始化 Modal
    this.settingsModal = new Modal(document.getElementById('settingsModal'));
    this.adminAssetsModal = new Modal(
      document.getElementById('adminAssetsModal')
    );

    // 綁定設定按鈕事件
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        if (this.adminAssetsModal) {
          this.adminAssetsModal.hide();
        }
        if (this.settingsModal) {
          this.settingsModal.show();
          this.loadSettings();
        }
      });
    }

    this.bindResetButton();
  }

  loadSettings() {
    const settingsSection = document.getElementById('settings-section');
    if (settingsSection) {
      settingsSection.innerHTML = `
        <div class="settings-content col-12 d-flex">
            <a href="./teacher-lobby.html" class="me-3">
                <button type="button" class="btn btn-lg btn-success">
                    其他遊戲
                </button>
            </a>
            <button id="reset-button" type="button" class="btn btn-lg btn-danger text-light">
                重新遊玩
            </button>
        </div>
      `;
    }
  }

  bindResetButton() {
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        if (confirm('確定要重置遊戲嗎？這將清除所有玩家的進度。')) {
          this.resetRoom();
        }
      });
    }
  }

  async resetRoom() {
    try {
      const roomRef = ref(this.rtdb, `rooms/${this.roomId}`);

      // 使用 runTransaction 確保重置過程的原子性
      await runTransaction(roomRef, (currentData) => {
        if (currentData === null) {
          // 如果房間不存在，終止交易
          return;
        }

        // 重置房間數據
        const newRoomData = {
          ...currentData,
          createdAt: Math.floor(Date.now() / 1000),
          gameState: {
            currentPlayer: 1,
            card: 'stock-1',
            diceRoll: 1,
            gameRound: 1,
            stockRound: 0,
            houseRound: 0,
            insurances: 10,
            currentEvent: '',
            currentIcon: '',
          },
          players: {},
        };

        // 生成新的玩家密碼
        const uniqueCodes = this.generateUniqueCodes(8);
        for (let i = 1; i <= 8; i++) {
          newRoomData.players[i] = {
            password: this.roomId + uniqueCodes[i - 1],
            joinedAt: 0,
            diceType: 1,
            rollStatus: 'idle',
            animationFinishedRemind: false,
            currentDiceValue: 0,
            lastDiceValue: 0,
            savings: 0,
            cash: 0,
            properties: {},
          };
        }

        return newRoomData;
      });

      // 關閉設定視窗
      if (this.settingsModal) {
        this.settingsModal.hide();
      }

      alert('遊戲已重置成功！');

      // 重新加載頁面
      window.location.reload();
    } catch (error) {
      console.error('重置房間時發生錯誤:', error);
      alert('重置失敗，請稍後再試。');
    }
  }

  generateUniqueCodes(playNumLimit) {
    const codes = new Set();
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    while (codes.size < playNumLimit) {
      const code =
        letters.charAt(Math.floor(Math.random() * letters.length)) +
        letters.charAt(Math.floor(Math.random() * letters.length));
      codes.add(code);
    }
    return Array.from(codes);
  }
}
