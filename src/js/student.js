// src/js/student.js
import { DiceModule } from './diceModule';
import { ref, onValue, update, get } from 'firebase/database';
import { rtdb } from './common';
import { Preloader } from './preloader';
import rounds from '../data/rounds.json';
const { gameRounds, stockRounds, houseRounds, stocksData, housesData } = rounds;

$(document).ready(async function () {
  let currentRoomData = null;
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room');
  const playerId = urlParams.get('player');
  if (!roomId || !playerId) {
    alert('無效的房間或玩家ID');
    return;
  }
  const preloader = new Preloader('/');
  await preloader.loadEssentialImages();
  const roomRef = ref(rtdb, `rooms/${roomId}`);
  let isUpdating = false;
  let currentStockRound = 0;
  let currentHouseRound = 0;
  let currentStockRoundPriceChange = 0;
  let currentStockRoundDividendChange = 0;
  let currentHouseRoundPriceChange = 0;
  let totalStockAssets = 0;
  let totalHouseAssets = 0;

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
      await update(ref(rtdb), updates);

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

  // 監聽房間狀態
  onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
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
        `階段變化：股價 ${
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
        `房間 ${roomId} / 玩家 ${playerId} / ${
          currentGameRound.icon
        } 第 ${currentGameRoundId} 回合：${currentGameRound.event}${
          nextGameRound.event == '無特殊事件' || nextGameRound.event == null
            ? ''
            : `（請注意下一回合要${nextGameRound.event}）`
        }`
      );
    }
  });

  // 確保在 DOM 中存在 #dice-container
  const diceModule = new DiceModule({
    rtdb,
    roomId,
    playerId,
    container: '#dice-container',
  });

  const playerRef = ref(rtdb, `rooms/${roomId}/players/${playerId}`);

  if (roomId != '1234') {
    alert('暫不開放其他教室');
    return;
  }

  onValue(playerRef, (snapshot) => {
    if (snapshot.exists()) {
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

          diceModule
            .playDiceAnimation(playerData.currentDiceValue, playerData.diceType)
            .then(() => {
              const updates = {};
              updates[`rooms/${roomId}/players/${playerId}/rollStatus`] =
                'completed';
              update(ref(rtdb), updates).catch((error) => {
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
    }
  });

  $('#dice-button').click(async function () {
    $(this).prop('disabled', true);
    try {
      const updates = {};
      updates[`rooms/${roomId}/players/${playerId}/rollStatus`] = 'rolled';
      await update(ref(rtdb), updates);
      diceModule.diceSound.play().catch((e) => console.log('播放音效失敗:', e));
    } catch (error) {
      console.error('擲骰時出錯:', error);
      $(this).prop('disabled', false);
    }
  });
});
