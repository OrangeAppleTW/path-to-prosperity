// src/js/teacher-lobby.js

import $ from 'jquery';
import { ref, get, set, onValue, off } from 'firebase/database'; // 引入 Realtime Database 函數

// 生成唯一的密碼碼
function generateUniqueCodes() {
  const codes = new Set();
  while (codes.size < 8) {
    // 生成兩位隨機小寫字母
    const code = String.fromCharCode(
      65 + Math.floor(Math.random() * 26),
      65 + Math.floor(Math.random() * 26)
    );

    // 將組合加入到 Set 中確保唯一性
    codes.add(code);
  }
  return Array.from(codes);
}

$(document).ready(function () {
  let currentListener = null; // 用於追蹤當前的監聽器函數
  let currentRoomCode = null; // 用於追蹤當前的 roomCode

  // 當表單提交時觸發
  $('#room-form').submit(function (e) {
    e.preventDefault(); // 防止表單默認提交行為

    const roomCode = $('#room-input').val().trim();

    if (roomCode === '') {
      displayMessage('請輸入教室代碼。');
      return;
    }

    if (roomCode != '1234') {
      alert('暫不開放其他教室');
      return;
    }

    const submitButton = $(this).find('button[type="submit"]');
    submitButton.prop('disabled', true); // 禁用提交按鈕
    displayMessage('正在處理請求...');

    const database = window.firebase.rtdb; // 獲取 Realtime Database 實例
    const roomRef = ref(database, 'rooms/' + roomCode);

    // 移除之前的監聽器（如果有）
    if (currentListener && currentRoomCode) {
      const oldPlayersRef = ref(
        database,
        'rooms/' + currentRoomCode + '/players'
      );
      off(oldPlayersRef, 'value', currentListener);
      currentListener = null;
      currentRoomCode = null;
    }

    get(roomRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          // 教室已存在，讀取資料
          const roomData = snapshot.val();
          console.log('教室資料:', roomData);
          displayMessage('教室已存在，正在讀取資料...');
          // 設置實時監聽器以監控 players 資料變更
          listenToPlayers(roomCode, database);
        } else {
          // 教室不存在，創建新教室
          const newRoomData = {
            createdAt: Math.floor(Date.now() / 1000),
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

          // 初始化 8 位玩家
          const uniqueCodes = generateUniqueCodes();
          for (let i = 1; i <= 8; i++) {
            newRoomData.players[i] = {
              password: roomCode + uniqueCodes[i - 1],
              joinedAt: 0,
              diceType: 1,
              rollStatus: 'idle', // 狀態枚舉：idle, connecting, rolled, animationPlayed
              currentDiceValue: 0,
              lastDiceValue: 0,
              savings: 0,
              cash: 0,
              properties: {},
            };
          }

          set(roomRef, newRoomData)
            .then(() => {
              console.log('新教室已創建:', newRoomData);
              displayMessage('教室不存在，已創建新教室。');
              // 設置實時監聽器以監控 players 資料變更
              listenToPlayers(roomCode, database);
            })
            .catch((error) => {
              console.error('創建教室時出錯:', error);
              displayMessage('創建教室時出錯，請稍後再試。');
            })
            .finally(() => {
              submitButton.prop('disabled', false); // 重新啟用提交按鈕
            });
        }
      })
      .catch((error) => {
        console.error('讀取教室資料時出錯:', error);
        displayMessage('讀取教室資料時出錯，請稍後再試。');
        submitButton.prop('disabled', false); // 重新啟用提交按鈕
      });
  });

  // 設置實時監聽器以監控 players 資料變更
  function listenToPlayers(roomCode, database) {
    const playersRef = ref(database, 'rooms/' + roomCode + '/players');

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

    // 更新當前監聽的教室代碼和監聽器
    currentListener = listener;
    currentRoomCode = roomCode;

    // 重新啟用提交按鈕
    const submitButton = $('#room-form').find('button[type="submit"]');
    submitButton.prop('disabled', false);
  }

  // 顯示訊息的函數
  function displayMessage(message) {
    $('#message-card').html(`<p>${message}</p>`);
  }

  // 顯示玩家資訊的函數
  function displayPlayers(players) {
    let htmlContent = `
      <table class="table table-striped">
        <thead>
          <tr>
            <th>玩家</th>
            <th>密碼</th>
            <th>狀態</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (const playerId in players) {
      if (players.hasOwnProperty(playerId)) {
        const player = players[playerId];
        const joinedAt =
          player.joinedAt === 0
            ? '未加入'
            : new Date(player.joinedAt * 1000).toLocaleString();
        const status =
          player.joinedAt === 0
            ? "<span class='badge bg-secondary'>未加入</span>"
            : "<span class='badge bg-success'>已加入</span>";

        htmlContent += `
          <tr>
            <td>${playerId}</td>
            <td>${player.password}</td>
            <td>${status}</td>
          </tr>
        `;
      }
    }

    htmlContent += `
        </tbody>
      </table>
      <a class="w-100" href="./teacher.html?room=${currentRoomCode}">
        <button type="button" class="w-100 btn btn-primary">前往教室</button>
      </a>
    `;

    $('#message-card').html(htmlContent);
  }
});
