import { ref, set, get } from 'firebase/database';
import { Modal } from 'bootstrap';
import { auth } from './common'; // 確保引入 auth

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

    // 檢查當前用戶是否為房間擁有者
    const isOwner = await this.checkIfOwner();

    settingsSection.innerHTML = `
      <div class="settings-content col-12 d-flex">
        <button id="back-button" type="button" class="btn btn-lg btn-success text-light me-3">
          返回大廳
        </button>
        <button id="reset-button" type="button" class="btn btn-lg btn-danger text-light" ${
          !isOwner ? 'disabled' : ''
        }>
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

    // 只有房間擁有者才能使用重置功能
    const resetButton = document.getElementById('reset-button');
    if (resetButton && isOwner) {
      resetButton.addEventListener('click', async () => {
        if (confirm('確定要刪除房間並返回大廳嗎？')) {
          try {
            const roomRef = ref(this.db, `rooms/${this.roomId}`);
            await set(roomRef, null);
            this.settingsModal.hide();
            window.location.href = './teacher-lobby.html';
          } catch (error) {
            console.error('刪除房間時發生錯誤:', error);
            alert('刪除房間失敗，請稍後再試。');
          }
        }
      });
    }
  }

  async checkIfOwner() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;

      const roomRef = ref(this.db, `rooms/${this.roomId}`);
      const roomSnapshot = await get(roomRef);

      if (!roomSnapshot.exists()) return false;

      const roomData = roomSnapshot.val();
      return roomData.owner === currentUser.uid;
    } catch (error) {
      console.error('檢查房間擁有者時發生錯誤:', error);
      return false;
    }
  }
}
