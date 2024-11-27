import $ from 'jquery';
import { ref, get, update, set } from 'firebase/database';
import { auth, db } from './common';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

$(document).ready(function () {
  signInAnonymously(auth)
    .then(() => {
      console.log('匿名登入成功');
    })
    .catch((error) => {
      console.error('匿名登入失敗:', error);
      displayMessage('匿名登入失敗，請稍後再試。');
    });

  // 監聽認證狀態變化
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('已登入用戶:', user.uid);

      try {
        // 定義用戶在 Realtime Database 中的路徑
        const userRef = ref(db, `users/${user.uid}`);

        // 獲取用戶資料
        const userSnapshot = await get(userRef);

        // 如果用戶資料不存在，則設置 uid 和 createdAt
        if (!userSnapshot.exists()) {
          const createdAt = Date.now();
          await set(userRef, {
            uid: user.uid,
            createdAt: createdAt,
          });
          console.log(`用戶 ${user.uid} 的資料已創建。`);
        } else {
          console.log(`用戶 ${user.uid} 的資料已存在。`);
        }
      } catch (error) {
        console.error('設置用戶資料時出錯:', error);
      }

      // 您可以在此處執行進一步操作，例如檢查是否已經綁定邀請碼
    } else {
      console.log('用戶未登入');
    }
  });
  // 頁面加載時，檢查 localStorage 中是否有存儲的密碼
  const savedJoinCode = localStorage.getItem('lastJoinCode');
  if (savedJoinCode) {
    $('#room-input').val(savedJoinCode);
  }

  $('#room-form').submit(function (e) {
    e.preventDefault();

    let joinCode = $('#room-input').val().trim();

    if (joinCode === '') {
      displayMessage('請輸入邀請代碼。');
      return;
    }

    if (joinCode.length < 6) {
      displayMessage('加入代碼格式不正確，請重新輸入。');
      return;
    }

    // 將輸入的代碼存儲到 localStorage

    const roomId = joinCode.slice(0, -2);
    const password = roomId + joinCode.slice(-2).toUpperCase();
    localStorage.setItem('lastJoinCode', password);

    const submitButton = $(this).find('button[type="submit"]');
    submitButton.prop('disabled', true);
    displayMessage('正在處理請求...');

    const database = db;
    const roomRef = ref(database, 'rooms/' + roomId);

    get(roomRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const roomData = snapshot.val();
          const players = roomData.players;

          let playerId = null;

          for (const key in players) {
            if (players.hasOwnProperty(key)) {
              const player = players[key];
              if (player.password === password) {
                playerId = key;
                break;
              }
            }
          }

          if (playerId) {
            const playerRef = ref(
              database,
              'rooms/' + roomId + '/players/' + playerId
            );
            const currentTime = Date.now();
            update(playerRef, { joinedAt: currentTime })
              .then(() => {
                window.location.href = `./student.html?room=${roomId}&player=${playerId}`;
              })
              .catch((error) => {
                console.error('更新玩家資料時出錯:', error);
                displayMessage('加入教室時出錯，請稍後再試。');
                submitButton.prop('disabled', false);
              });
          } else {
            displayMessage('加入代碼無效，請重新確認。');
            submitButton.prop('disabled', false);
          }
        } else {
          displayMessage('教室不存在，請確認您的加入代碼。');
          submitButton.prop('disabled', false);
        }
      })
      .catch((error) => {
        console.error('讀取教室資料時出錯:', error);
        displayMessage('讀取教室資料時出錯，請稍後再試。');
        submitButton.prop('disabled', false);
      });
  });

  function displayMessage(message) {
    $('#message-card').html(`<p class="m-0">${message}</p>`);
    $('#message-card').show();
  }
});
