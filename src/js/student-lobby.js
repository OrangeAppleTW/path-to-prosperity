// src/js/student-lobby.js

import $ from 'jquery';
import { ref, get, update } from 'firebase/database'; // 引入 Realtime Database 函數

$(document).ready(function () {
  // 當表單提交時觸發
  $('#room-form').submit(function (e) {
    e.preventDefault(); // 防止表單默認提交行為

    const joinCode = $('#room-input').val().trim();

    if (joinCode === '') {
      displayMessage('請輸入加入代碼。');
      return;
    }

    if (joinCode.length < 6) {
      displayMessage('加入代碼格式不正確，請重新輸入。');
      return;
    }

    // 提取 roomId (前四位) 和 password (後兩位)
    const roomId = joinCode.substring(0, 4);
    const password = roomId + joinCode.substring(4).toUpperCase(); // 將密碼轉為大寫以匹配

    const submitButton = $(this).find('button[type="submit"]');
    submitButton.prop('disabled', true); // 禁用提交按鈕
    displayMessage('正在處理請求...');

    const database = window.firebase.rtdb; // 獲取 Realtime Database 實例
    const roomRef = ref(database, 'rooms/' + roomId);

    get(roomRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          // 教室已存在，檢查玩家密碼
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
            // 找到匹配的玩家，更新 joinedAt
            const playerRef = ref(
              database,
              'rooms/' + roomId + '/players/' + playerId
            );
            const currentTime = Math.floor(Date.now() / 1000); // 當前時間戳（秒）
            update(playerRef, { joinedAt: currentTime })
              .then(() => {
                // 重定向到學生頁面
                window.location.href = `./student.html?room=${roomId}&player=${playerId}`;
              })
              .catch((error) => {
                console.error('更新玩家資料時出錯:', error);
                displayMessage('加入教室時出錯，請稍後再試。');
                submitButton.prop('disabled', false); // 重新啟用提交按鈕
              });
          } else {
            // 密碼不匹配
            displayMessage('加入代碼無效，請重新確認。');
            submitButton.prop('disabled', false); // 重新啟用提交按鈕
          }
        } else {
          // 教室不存在
          displayMessage('教室不存在，請確認您的加入代碼。');
          submitButton.prop('disabled', false); // 重新啟用提交按鈕
        }
      })
      .catch((error) => {
        console.error('讀取教室資料時出錯:', error);
        displayMessage('讀取教室資料時出錯，請稍後再試。');
        submitButton.prop('disabled', false); // 重新啟用提交按鈕
      });
  });

  // 顯示訊息的函數
  function displayMessage(message) {
    $('#message-card').html(`<p>${message}</p>`);
  }
});
