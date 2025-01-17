// src/js/student.js
import { DiceModule } from './diceModule';
import { ref, onValue, update, get } from 'firebase/database';
import { auth, db } from './common';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Preloader } from './preloader';
import rounds from '../data/rounds.json';
const { gameRounds, stockRounds, houseRounds, stocksData, housesData } = rounds;

async function validateJoinCode(roomId, playerId, joinCode) {
  try {
    const playerRef = ref(db, `rooms/${roomId}/players/${playerId}`);
    const playerSnapshot = await get(playerRef);

    if (!playerSnapshot.exists()) {
      console.log('玩家不存在');
      return false;
    }

    if (playerSnapshot.val().joinedAt === 0) {
      console.log('玩家不存在');
      return false;
    }

    const playerData = playerSnapshot.val();
    return playerData.password === joinCode;
  } catch (error) {
    console.error('驗證加入代碼時出錯:', error);
    return false;
  }
}

$(document).ready(async function () {
  let authInitialized = false;
  let isValidated = false;

  // 進行匿名登入
  try {
    await signInAnonymously(auth);
    console.log('匿名登入成功');
  } catch (error) {
    console.error('匿名登入失敗:', error);
    alert('登入失敗，請重試');
    window.location.href = './student-lobby.html';
    return;
  }

  // 獲取必要參數
  const savedJoinCode = localStorage.getItem('lastJoinCode');
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room');
  const playerId = urlParams.get('player');

  // 驗證基本參數
  if (!savedJoinCode || !roomId || !playerId) {
    console.log('缺少必要參數');
    window.location.href = './student-lobby.html';
    return;
  }

  // if (roomId !== '1234') {
  //   alert('暫不開放其他教室');
  //   window.location.href = './student-lobby.html';
  //   return;
  // }

  // 監聽認證狀態變化
  onAuthStateChanged(auth, async (user) => {
    if (!authInitialized) {
      authInitialized = true;

      if (!user) {
        console.log('用戶未登入');
        window.location.href = './student-lobby.html';
        return;
      }

      console.log('已登入用戶:', user.uid);

      // 驗證 joinCode
      const isValid = await validateJoinCode(roomId, playerId, savedJoinCode);

      if (!isValid) {
        console.log('加入代碼驗證失敗');
        alert('加入失敗，請重新輸入邀請代碼！');
        window.location.href = './student-lobby.html';
        return;
      }

      isValidated = true;
      console.log('加入代碼驗證成功');

      // 初始化頁面
      initializePage();
    }
  });

  async function initializePage() {
    const diceModule = new DiceModule({
      db,
      roomId,
      playerId,
      container: '#dice-container',
    });

    window.addEventListener('beforeunload', async (event) => {
      if (roomId && playerId && isValidated) {
        try {
          const updates = {};
          updates[`rooms/${roomId}/players/${playerId}/joinedAt`] = 0;
          await update(ref(db), updates);
        } catch (error) {
          console.error('更新 joinedAt 失敗:', error);
        }
      }
    });

    let currentRoomData = null;
    const preloader = new Preloader('/');
    await preloader.loadEssentialImages();

    // 這裡放置原本的初始化代碼
    const roomRef = ref(db, `rooms/${roomId}`);
    let currentStockRound = 0;
    let currentHouseRound = 0;
    let currentStockRoundPriceChange = 0;
    let currentStockRoundDividendChange = 0;
    let currentHouseRoundPriceChange = 0;
    let totalStockAssets = 0;
    let totalHouseAssets = 0;

    function showDiceAlert(diceValue) {
      const alertDiv = $(`
        <div class="dice-alert alert alert-danger" role="alert">
            有向前移動的話，記得跟銀行領取 ${diceValue * 100} 元！
        </div>
    `).css({
        position: 'fixed',
        top: '50px',
        right: '50px',
        'z-index': '1050',
        'min-width': '200px',
        opacity: 0,
      });

      // 等待1秒後開始顯示
      setTimeout(() => {
        $('body').append(alertDiv);

        // 使用 requestAnimationFrame 確保動畫流暢
        requestAnimationFrame(() => {
          // 顯示動畫
          alertDiv.animate({ opacity: 1 }, 500, function () {
            // 顯示3秒後開始淡出
            setTimeout(() => {
              alertDiv.animate({ opacity: 0 }, 500, function () {
                $(this).remove();
              });
            }, 3000);
          });
        });
      }, 1000);
    }

    function generateTableHeader() {
      return `
      <table class="table m-0 table-bordered">
        <thead>
          <tr class="text-center table-secondary" style="height: 48px">
            <th class="align-middle col-1">類型</th> 
            <th class="align-middle col-2">資產</th>
            <th class="align-middle col-1">成本</th>
            <th class="align-middle col-1">價格</th>
            <th class="align-middle col-1">股息</th>
            <th class="align-middle col-1">房租</th>
            <th class="align-middle col-1">報酬</th>
          </tr>
        </thead>
        <tbody>
    `;
    }

    function generatePropertyRow(property, key, stocksMap, housesMap) {
      let assetBadge, assetDataName, currentPrice;
      let rawExpectedReturn, expectedReturn;
      let currentDividend, currentRent;

      if (property.soldAt > 0) return '';
      if (property.usedAt > 0) return '';

      if (property.type === 'stock' || property.type === 'house') {
        const assetId = property.property.split('-').pop();
        const isStock = property.type === 'stock';
        const assetMap = isStock ? stocksMap : housesMap;
        const assetData = assetMap.get(assetId);
        if (!assetData) return '';
        currentPrice = isStock
          ? assetData.price + currentStockRoundPriceChange
          : assetData.price + currentHouseRoundPriceChange;

        if (isStock) {
          totalStockAssets += currentPrice;
        } else {
          totalHouseAssets += currentPrice;
        }

        rawExpectedReturn = currentPrice - property.buyPrice;
        expectedReturn =
          rawExpectedReturn > 0
            ? `+${rawExpectedReturn}`
            : `${rawExpectedReturn}`;
        assetBadge = isStock
          ? '<span class="badge bg-warning text-light">股票</span>'
          : '<span class="badge bg-danger text-light">房屋</span>';
        assetDataName = assetData.name;
        currentDividend = isStock
          ? assetData.dividend + currentStockRoundDividendChange
          : '-';
        currentRent = isStock ? '-' : assetData.rent;
      }

      if (property.type === 'insurance') {
        assetBadge = '<span class="badge bg-success text-light">保險</span>';
        assetDataName = '保險卡';
        currentPrice = '-';
        rawExpectedReturn = '-';
        currentDividend = '-';
        currentRent = '-';
        expectedReturn = '-';
      }

      return `
      <tr style="height: 48px">
        <td class="align-middle text-center">${assetBadge}</td>
        <td class="align-middle text-center">${assetDataName}</td>
        <td class="align-middle text-center">${property.buyPrice}</td>
        <td class="align-middle text-center">${currentPrice}</td>
        <td class="align-middle text-center">${currentDividend}</td>
        <td class="align-middle text-center">${currentRent}</td>
        <td class="align-middle text-center">${expectedReturn}</td>
      </tr>
    `;
    }

    async function updatePropertyStatus(
      propertyId,
      soldAtValue,
      soldPrice,
      playerData
    ) {
      if (isUpdating) {
        alert('請等待當前操作完成');
        return;
      }
      isUpdating = true;
      try {
        const updates = {};
        const propertyPath = `rooms/${roomId}/players/${playerId}/properties/${propertyId}`;

        const propertyData = JSON.parse(
          JSON.stringify(playerData.properties[propertyId])
        );
        propertyData.soldAt = soldAtValue;
        propertyData.soldPrice = soldPrice;

        updates[propertyPath] = propertyData;
        await update(ref(db), updates);

        return true;
      } catch (error) {
        console.error('Error updating property status:', error);
        throw error;
      } finally {
        isUpdating = false;
      }
    }

    function renderPropertiesTable(roomData) {
      if (!roomData.createdAt) return;

      if (!Object.keys(roomData.players).includes(playerId)) {
        window.location.href = `./student-lobby.html`;
      }
      let playerData = roomData.players[playerId];
      if (savedJoinCode !== playerData.password) {
        alert('加入失敗，請重新輸入邀請代碼！');
        window.location.href = `./student-lobby.html`;
      }

      const stocksMap = new Map(
        stocksData.map((stock) => [stock.id.substring(1), stock])
      );
      const housesMap = new Map(
        housesData.map((house) => [house.id.substring(1), house])
      );

      let tableHtml = generateTableHeader();

      if (playerData.properties) {
        const properties = Object.entries(playerData.properties)
          .filter(
            ([, property]) =>
              !property.soldAt || property.soldAt === 0 || property.usedAt === 0
          )
          .sort(([, a], [, b]) => a.buyAt - b.buyAt);

        properties.forEach(([key, property]) => {
          tableHtml += generatePropertyRow(property, key, stocksMap, housesMap);
        });

        if (properties.length === 0) {
          tableHtml += getEmptyRow();
        }
      } else {
        tableHtml += getEmptyRow();
      }

      tableHtml += '</tbody></table>';
      $('#held-properties-sec').html(tableHtml);
    }

    function getEmptyRow() {
      return `
      <tr style="height: 48px">
        <td class="align-middle text-center">-</td>
        <td class="align-middle text-center">-</td>
        <td class="align-middle text-center">-</td>
        <td class="align-middle text-center">-</td>
        <td class="align-middle text-center">-</td>
        <td class="align-middle text-center">-</td>
        <td class="align-middle text-center">-</td>
      </tr>
    `;
    }

    onValue(roomRef, (snapshot) => {
      if (!isValidated) return;
      if (!snapshot.exists()) {
        window.location.href = './student-lobby.html';
        return;
      }
      const roomData = snapshot.val();
      $('#game-status').text(
        `當前回合：${roomData.gameState?.currentEvent || '等待中'}`
      );
      currentRoomData = roomData;
      let currentGameRoundId = Number(currentRoomData.gameState.gameRound);
      let currentGameRound = gameRounds[currentGameRoundId];
      let nextGameRoundId =
        Object.keys(gameRounds).length <
        Number(currentRoomData.gameState.gameRound) + 1
          ? 0
          : Number(currentRoomData.gameState.gameRound) + 1;
      let nextGameRound =
        nextGameRoundId == 0 ? '' : gameRounds[nextGameRoundId];
      currentStockRound = Number(currentRoomData.gameState.stockRound);
      currentHouseRound = Number(currentRoomData.gameState.houseRound);
      currentStockRoundPriceChange = stockRounds[currentStockRound].priceChange;
      currentStockRoundDividendChange =
        stockRounds[currentStockRound].dividendChange;
      currentHouseRoundPriceChange = houseRounds[currentHouseRound].priceChange;
      totalStockAssets = 0;
      totalHouseAssets = 0;
      renderPropertiesTable(currentRoomData);

      let currentGameRoundText = `目前回合：${
        currentGameRound.icon
      } 第 ${currentGameRoundId} 回合${
        currentGameRound.event ? ' - ' + currentGameRound.event : ''
      }`;

      // $('#current-round').text(currentGameRoundText);

      let nextGameRoundText =
        nextGameRound === ''
          ? '下一回合：📍 遊戲結束'
          : `下一回合：${nextGameRound.icon} 第 ${nextGameRoundId} 回合${
              nextGameRound.event ? ' - ' + nextGameRound.event : ''
            }`;
      // $('#next-round').text(nextGameRoundText);
      $('#price-change').text(
        `房間 ${roomId} / 玩家 ${playerId} / 股價 ${
          currentStockRoundPriceChange > 0
            ? `+${currentStockRoundPriceChange}`
            : currentStockRoundPriceChange
        } / 股息 ${
          currentStockRoundDividendChange > 0
            ? `+${currentStockRoundDividendChange}`
            : currentStockRoundDividendChange
        } / 房價 ${
          currentHouseRoundPriceChange > 0
            ? `+${currentHouseRoundPriceChange}`
            : currentHouseRoundPriceChange
        }`
      );
      $('#total-savings-assets').val(currentRoomData.players[playerId].savings);
      $('#total-stock-assets').val(totalStockAssets);
      $('#total-house-assets').val(totalHouseAssets);

      $('#player-info').text(
        `${currentGameRound.icon} 第 ${currentGameRoundId} 回合：${
          currentGameRound.event
        }${
          nextGameRound.event == '無特殊事件' || nextGameRound.event == null
            ? ''
            : `（請注意下一回合要${nextGameRound.event}）`
        }`
      );
    });

    const playerRef = ref(db, `rooms/${roomId}/players/${playerId}`);

    onValue(playerRef, (snapshot) => {
      if (!isValidated) return;
      if (!snapshot.exists()) {
        window.location.href = './student-lobby.html';
        return;
      }
      const playerData = snapshot.val();
      renderPropertiesTable(playerData);

      // 更新骰子按鈕狀態
      const $diceButton = $('#dice-button');
      const $diceStatus = $('#dice-status');

      // 設定等待圖片的共用樣式
      const setWaitingImage = () => {
        $diceStatus.css({
          'background-image': 'url(/assets/images/dice_wait.png)',
          'background-position': 'center bottom',
          'background-repeat': 'no-repeat',
          'background-size': 'cover',
        });
      };

      switch (playerData.rollStatus) {
        case 'connecting':
          $diceButton.prop('disabled', false).show();
          $diceStatus.css({
            'background-image': 'url(/assets/images/dice_go.png)',
            'background-position': 'center bottom',
            'background-repeat': 'no-repeat',
            'background-size': 'cover',
          });
          break;

        case 'rolled':
          $diceButton.prop('disabled', true).hide();
          $diceStatus.css({
            'background-image': '',
          });
          break;

        case 'animationPlayed':
          $diceStatus.css({
            'background-image': '',
          });
          $diceButton.prop('disabled', true).hide();

          // 顯示骰子點數提示
          showDiceAlert(playerData.currentDiceValue);

          diceModule
            .playDiceAnimation(playerData.currentDiceValue, playerData.diceType)
            .then(() => {
              const updates = {};
              updates[`rooms/${roomId}/players/${playerId}/rollStatus`] =
                'completed';
              update(ref(db), updates).catch((error) => {
                console.error('更新狀態失敗:', error);
              });
            });
          break;

        case 'completed':
        case 'idle':
        default:
          $diceButton.prop('disabled', true).hide();
          setWaitingImage();
          $('#dice-container').show();
          break;
      }
    });

    $('#dice-button').click(async function () {
      $(this).prop('disabled', true);
      try {
        const updates = {};
        updates[`rooms/${roomId}/players/${playerId}/rollStatus`] = 'rolled';
        await update(ref(db), updates);
        diceModule.diceSound
          .play()
          .catch((e) => console.log('播放音效失敗:', e));
      } catch (error) {
        console.error('擲骰時出錯:', error);
        $(this).prop('disabled', false);
      }
    });
  }
});
