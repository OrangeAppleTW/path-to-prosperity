// src/js/settingsHandler.js
import { ref, runTransaction } from 'firebase/database';
import { Modal } from 'bootstrap';

export class SettingsHandler {
  constructor(rtdb, roomId) {
    this.rtdb = rtdb;
    this.roomId = roomId;

    // 直接初始化 Modal
    this.settingsModal = new Modal(document.getElementById('settingsModal'));
    this.adminAssetsModal = new Modal(
      document.getElementById('adminAssetsModal')
    );

    // 直接綁定事件
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
  }

  loadSettings() {
    const settingsSection = document.getElementById('settings-section');
    if (settingsSection) {
      settingsSection.innerHTML = `
        <div class="settings-content col-12 d-flex">
          <!-- 設定選項內容 -->
            <a href="./teacher-lobby.html" class="me-3">
                <button type="button" class="btn btn-lg btn-success">
                    開啟其他遊戲
                </button>
            </a>
            <button disabled type="button" class="btn btn-lg btn-danger text-light">
                重新遊玩
            </button>
        </div>
      `;
    }
  }
}
