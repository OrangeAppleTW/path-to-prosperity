import { ref, set } from 'firebase/database';
import { Modal } from 'bootstrap';

export class SettingsHandler {
  constructor(rtdb, roomId) {
    this.rtdb = rtdb;
    this.roomId = roomId;
    this.settingsModal = new Modal(document.getElementById('settingsModal'));

    // 綁定設定按鈕事件
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        this.loadSettings();
        this.settingsModal.show();
      });
    }
  }

  loadSettings() {
    const settingsSection = document.getElementById('settings-section');
    if (settingsSection) {
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

      // 綁定重置按鈕事件
      const resetButton = document.getElementById('reset-button');
      if (resetButton) {
        resetButton.addEventListener('click', async () => {
          if (confirm('確定要刪除房間並返回大廳嗎？')) {
            try {
              // 刪除房間數據
              const roomRef = ref(this.rtdb, `rooms/${this.roomId}`);
              await set(roomRef, null);

              // 關閉 Modal
              this.settingsModal.hide();

              // 跳轉到教師大廳
              window.location.href = './teacher-lobby.html';
            } catch (error) {
              console.error('刪除房間時發生錯誤:', error);
              alert('刪除房間失敗，請稍後再試。');
            }
          }
        });
      }
    }
  }
}
