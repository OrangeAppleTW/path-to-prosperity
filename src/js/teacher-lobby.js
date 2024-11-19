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
          const createdAt = Math.floor(Date.now() / 1000);
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

      // 您可以在此處執行進一步操作，例如檢查是否已經綁定優惠券
    } else {
      console.log('用戶未登入');
    }
  });

  let currentListener = null; // 用於追蹤當前的監聽器函數
  let currentRoomCode = null; // 用於追蹤當前的 roomCode
  const playNumLimit = 8;

  const savedRoomCode = localStorage.getItem('lastRoomCode');
  if (savedRoomCode) {
    $('#room-input').val(savedRoomCode);
  }

  // 當表單提交時觸發
  $('#room-form').submit(async function (e) {
    e.preventDefault(); // 防止表單默認提交行為

    const submitButton = $(this).find('button[type="submit"]');
    submitButton.prop('disabled', true); // 禁用提交按鈕
    displayMessage('正在處理請求...');

    try {
      const user = auth.currentUser;
      if (!user) {
        alert('請先登入。');
        $('#message-card').hide().empty();
        return;
      }

      // 1. 檢查用戶是否已有優惠券
      const userCouponRef = ref(db, `users/${user.uid}/coupon`);
      const userCouponSnapshot = await get(userCouponRef);
      let couponCode = null;

      if (userCouponSnapshot.exists()) {
        // 用戶已有優惠券，直接使用
        couponCode = userCouponSnapshot.val();
        console.log('用戶已經擁有優惠券:', couponCode);

        // 2. 驗證已存在的優惠券
        const existingCouponRef = ref(db, `coupons/${couponCode}`);
        const existingCouponSnapshot = await get(existingCouponRef);

        if (!existingCouponSnapshot.exists()) {
          alert('您的優惠券無效或不存在。請重新輸入邀請碼。');
          $('#message-card').hide().empty();
          await set(userCouponRef, null); // 移除無效的優惠券
          couponCode = await promptAndValidateCoupon(user);
        } else {
          const couponData = existingCouponSnapshot.val();
          const currentTime = Math.floor(Date.now() / 1000);
          if (currentTime >= couponData.expiredAt) {
            alert('您的優惠券已過期。請輸入新的邀請碼。');
            $('#message-card').hide().empty();
            await set(userCouponRef, null); // 移除過期的優惠券
            couponCode = await promptAndValidateCoupon(user);
          } else {
            console.log('優惠券驗證成功，正在加入房間...');
          }
        }
      } else {
        // 用戶沒有優惠券，提示輸入
        couponCode = await promptAndValidateCoupon(user);
      }

      if (!couponCode) {
        // 如果驗證失敗，提前退出
        return;
      }

      // 3. 獲取並驗證房間代碼
      const roomCode = $('#room-input').val().trim();
      localStorage.setItem('lastRoomCode', roomCode);

      if (roomCode === '') {
        displayMessage('請輸入房間代碼。');
        return;
      }

      // if (roomCode !== '1234') {
      //   // 如果有多個允許的房間代碼，可以進行擴展
      //   alert('暫不開放其他房間');
      //   $('#message-card').hide().empty();
      //   return;
      // }

      // 4. 獲取 Realtime Database 實例並設定房間參考
      const database = db;
      const roomRefPath = `rooms/${roomCode}`;
      const roomRefDB = ref(database, roomRefPath);

      // 5. 移除之前的監聽器（如果有）
      if (currentListener && currentRoomCode) {
        const oldPlayersRef = ref(database, `rooms/${currentRoomCode}/players`);
        off(oldPlayersRef, 'value', currentListener);
        currentListener = null;
        currentRoomCode = null;
      }

      // 6. 檢查房間是否存在
      const roomSnapshot = await get(roomRefDB);

      if (roomSnapshot.exists()) {
        // 房間已存在，讀取資料並設置監聽器
        const roomData = roomSnapshot.val();
        console.log('房間資料:', roomData);
        displayMessage('房間已存在，正在讀取資料...');
        listenToPlayers(roomCode, database);
      } else {
        // 房間不存在，創建新房間
        const newRoomData = {
          createdAt: Math.floor(Date.now() / 1000),
          owner: auth.currentUser.uid,
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

        // 初始化玩家數量（假設 playNumLimit 已定義）
        const uniqueCodes = generateUniqueCodes(playNumLimit);

        for (let i = 1; i <= playNumLimit; i++) {
          newRoomData.players[i] = {
            password: roomCode + uniqueCodes[i - 1],
            joinedAt: 0,
            diceType: 1,
            rollStatus: 'idle', // 狀態枚舉：idle, connecting, rolled, animationPlayed
            animationFinishedRemind: false,
            currentDiceValue: 0,
            lastDiceValue: 0,
            savings: 0,
            cash: 0,
            properties: {},
          };
        }

        // 創建新房間
        await set(roomRefDB, newRoomData);
        console.log('新房間已創建:', newRoomData);
        displayMessage('房間不存在，已創建新房間。');
        listenToPlayers(roomCode, database);
      }
    } catch (error) {
      console.error('發生錯誤:', error);
      alert('發生錯誤，請稍後再試。');
      $('#message-card').hide().empty();
    } finally {
      // 重新啟用提交按鈕
      submitButton.prop('disabled', false);
    }
  });

  async function promptAndValidateCoupon(user) {
    let couponCode = prompt('請輸入邀請碼')?.trim();
    if (!couponCode) {
      alert('請輸入邀請碼。');
      $('#message-card').hide().empty();
      return null;
    }

    // 驗證優惠券
    const couponRef = ref(db, `coupons/${couponCode}`);
    const couponSnapshot = await get(couponRef);

    if (!couponSnapshot.exists()) {
      alert('優惠券無效或不存在。');
      $('#message-card').hide().empty();
      return null;
    }

    const couponData = couponSnapshot.val();
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime >= couponData.expiredAt) {
      alert('優惠券已過期。');
      $('#message-card').hide().empty();
      return null;
    }

    // 將優惠券碼設定給使用者
    const userCouponRef = ref(db, `users/${user.uid}/coupon`);
    await set(userCouponRef, couponCode);
    console.log('優惠券驗證成功，已儲存優惠券碼。');

    return couponCode;
  }

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

    // 更新當前監聽的房間代碼和監聽器
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
  async function displayPlayers(players) {
    // 獲取房間資料以檢查擁有者
    const roomRef = ref(db, `rooms/${currentRoomCode}`);
    const roomSnapshot = await get(roomRef);
    const roomData = roomSnapshot.val();
    const currentUser = auth.currentUser;
    const isOwner =
      roomData && currentUser && roomData.owner === currentUser.uid;

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
        const joinedAt =
          player.joinedAt === 0
            ? '未加入'
            : new Date(player.joinedAt * 1000).toLocaleString();
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
    <a class="w-100" href="./teacher.html?room=${currentRoomCode}">
      <button type="button" class="mt-3 w-100 text-light btn ${
        isOwner ? 'btn-success' : 'btn-danger'
      }">
        ${isOwner ? '前往我創建的房間' : '前往其他人的房間'}
      </button>
    </a>
  `;

    $('#message-card').html(htmlContent);
    $('#message-card').show();
  }
});
