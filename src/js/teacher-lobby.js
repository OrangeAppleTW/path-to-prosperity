// src/js/teacher-lobby.js

import $ from 'jquery';
import { ref, get, set, onValue, off } from 'firebase/database'; // 引入 Realtime Database 函數
import { auth, db } from './common';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// 生成唯一的密碼碼
function generateUniqueCodes(playNumLimit) {
  // 定義可用的字母（排除 O, I, L 等容易混淆的字母）
  const validLetters = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const codes = new Set();

  while (codes.size < playNumLimit) {
    // 隨機選擇第一個字母
    const firstChar =
      validLetters[Math.floor(Math.random() * validLetters.length)];

    // 為第二個字母創建一個臨時數組（排除第一個字母）
    const secondValidLetters = validLetters.replace(firstChar, '');

    // 隨機選擇第二個字母
    const secondChar =
      secondValidLetters[Math.floor(Math.random() * secondValidLetters.length)];

    // 組合兩個字母
    const code = firstChar + secondChar;

    // 將組合加入到 Set 中確保唯一性
    codes.add(code);
  }

  return Array.from(codes);
}

$(document).ready(function () {
  // 進行匿名登入
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

  let currentListener = null; // 用於追蹤當前的監聽器函數
  let currentRoomId = null; // 用於追蹤當前的 roomId
  const playNumLimit = 8;

  const savedRoomCode = localStorage.getItem('lastRoomCode');
  if (savedRoomCode) {
    $('#room-input').val(savedRoomCode);
  }

  // 當表單提交時觸發
  $('#room-form').submit(async function (e) {
    e.preventDefault();
    const submitButton = $(this).find('button[type="submit"]');
    submitButton.prop('disabled', true);
    displayMessage('正在處理請求...');

    try {
      const user = auth.currentUser;
      if (!user) {
        alert('請先登入。');
        $('#message-card').hide().empty();
        return;
      }

      // 獲取房間代碼
      const roomCode = $('#room-input').val().trim();
      localStorage.setItem('lastRoomCode', roomCode);

      if (roomCode === '') {
        displayMessage('請輸入房間代碼。');
        return;
      }

      if (roomCode.length < 10) {
        alert('房間代碼有誤，請重新確認！');
        return;
      }

      const roomId = roomCode.slice(0, -6);
      const roomPassword = roomCode.slice(-6);

      // 設定資料庫參考
      const database = db;
      const roomRefPath = `rooms/${roomId}`;
      const roomRefDB = ref(database, roomRefPath);

      // 移除之前的監聽器
      if (currentListener && currentRoomId) {
        const oldPlayersRef = ref(database, `rooms/${currentRoomId}/players`);
        off(oldPlayersRef, 'value', currentListener);
        currentListener = null;
        currentRoomId = null;
      }

      // 檢查房間是否存在
      const roomSnapshot = await get(roomRefDB);

      if (roomSnapshot.exists()) {
        const roomData = roomSnapshot.val();

        if (roomPassword != roomData.password) {
          alert('代碼有誤，請重新輸入房間代碼！');
          $('#message-card').hide().empty();
          return;
        }

        if (Date.now() > roomData.expiredAt) {
          alert('房間失效，請重新輸入房間代碼！');
          $('#message-card').hide().empty();
          return;
        }

        displayMessage('房間已存在,正在讀取資料...');
        listenToPlayers(roomId, database);
      }
    } catch (error) {
      console.error('發生錯誤:', error);
      alert('發生錯誤,請稍後再試。');
      $('#message-card').hide().empty();
    } finally {
      submitButton.prop('disabled', false);
    }
  });

  // 設置實時監聽器以監控 players 資料變更
  function listenToPlayers(roomId, database) {
    const playersRef = ref(database, 'rooms/' + roomId + '/players');

    // 清空 message-card
    $('#message-card').html(`<p></p>`);

    // 定義監聽器回調函數
    const listener = (snapshot) => {
      if (snapshot.exists()) {
        const playersData = snapshot.val();
        console.log('玩家資料更新:', playersData);
        displayPlayers(playersData);
      } else {
        displayMessage('目前沒有玩家資料。');
      }
    };

    const errorCallback = (error) => {
      console.error('監聽玩家資料時出錯:', error);
      displayMessage('監聽玩家資料時出錯，請稍後再試。');
    };

    // 設置監聽器
    onValue(playersRef, listener, errorCallback);

    // 更新當前監聽的房間代碼和監聽器
    currentListener = listener;
    currentRoomId = roomId;

    // 重新啟用提交按鈕
    const submitButton = $('#room-form').find('button[type="submit"]');
    submitButton.prop('disabled', false);
  }

  // 顯示訊息的函數
  function displayMessage(message) {
    $('#message-card').html(`<p>${message}</p>`);
  }

  // 顯示玩家資訊的函數
  async function displayPlayers(players) {
    let htmlContent = `
    <div style="height: 50vh; overflow-y: scroll">
      <table class="table table-bordered m-0" >
        <thead class="table-secondary">
          <tr style="height: 48px" class="align-middle text-center">
            <th class="align-middle">玩家狀態</th>
            <th class="align-middle">玩家名稱</th>
            <th class="align-middle">邀請代碼</th>
          </tr>
        </thead>
        <tbody>
  `;

    for (const playerId in players) {
      if (players.hasOwnProperty(playerId)) {
        const player = players[playerId];
        const status =
          player.joinedAt === 0
            ? "<span class='badge bg-secondary'>未加入</span>"
            : "<span class='badge bg-success'>已加入</span>";

        htmlContent += `
        <tr style="height: 48px" class="align-middle text-center">
          <td class="col-1 align-middle">${status}</td>
          <td class="col-1 align-middle">玩家 ${playerId}</td>
          <td class="col-1 align-middle">${player.password}</td>
        </tr>
      `;
      }
    }

    htmlContent += `
      </tbody>
    </table>
    </div>
    <a class="w-100" href="./teacher.html?room=${currentRoomId}">
      <button type="button" class="mt-3 w-100 text-light btn btn-success">
        前往房間
      </button>
    </a>
  `;

    $('#message-card').html(htmlContent);
    $('#message-card').show();
  }
});
