import $ from 'jquery';
import { ref, get, update } from 'firebase/database';
import { db } from './common';

$(document).ready(function () {
  // 頁面加載時，檢查 localStorage 中是否有存儲的密碼
  const savedJoinCode = localStorage.getItem('lastJoinCode');
  if (savedJoinCode) {
    $('#room-input').val(savedJoinCode);
  }

  $('#room-form').submit(function (e) {
    e.preventDefault();

    let joinCode = $('#room-input').val().trim();

    if (joinCode === '') {
      displayMessage('請輸入加入代碼。');
      return;
    }

    if (joinCode.length < 6) {
      displayMessage('加入代碼格式不正確，請重新輸入。');
      return;
    }

    // 將輸入的代碼存儲到 localStorage

    const roomId = joinCode.substring(0, 4);
    const password = roomId + joinCode.substring(4).toUpperCase();
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
            const currentTime = Math.floor(Date.now() / 1000);
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
