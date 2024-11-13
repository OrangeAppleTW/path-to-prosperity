// src/js/teacher.js

import $ from 'jquery';
import { ref, onValue, update } from 'firebase/database';
import { rtdb } from './common';
import { Preloader } from './preloader';
import { DragHandler } from './dragHandler';
import { RoomDisplay } from './roomDisplay';
import { CardDrawer } from './cardDrawer';
import { InsuranceHandler } from './insuranceHandler';
import { SavingsHandler } from './savingsHandler';
import { GameRoundSelector } from './GameRoundSelector';
import { StockRoundSelector } from './StockRoundSelector';
import { HouseRoundSelector } from './HouseRoundSelector';
import { PlayerSelector } from './PlayerSelector';
import { DiceModule } from './diceModule';
import { AssetsManager } from './assetsManager';
import { AdminAssetsManager } from './adminAssetsManager';
import { RentCounter } from './rentCounter';
import { DividendCounter } from './dividendCounter.js';
import { InterestCounter } from './interestCounter.js';
import { SettlementHandler } from './settlementHandler.js';
import { SettingsHandler } from './settingsHandler';
import rounds from '../data/rounds.json';
import Modal from 'bootstrap/js/dist/modal';

const { gameRounds, stockRounds, houseRounds, stocksData, housesData } = rounds;

// 全局變數來存儲當前價格變動值
let currentStockRoundPriceChange = 0;
let currentStockRoundDividendChange = 0;
let currentHouseRoundPriceChange = 0;

class DiceHandler {
  constructor(rtdb, roomId, sounds, getCurrentPlayerId) {
    this.rtdb = rtdb;
    this.roomId = roomId;
    this.sounds = sounds;
    this.getCurrentPlayerId = getCurrentPlayerId;
    this.diceModule = null;
    this.initializeDiceListener();
  }

  initializeDiceListener() {
    const roomRef = ref(this.rtdb, `rooms/${this.roomId}/players`);
    onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const players = snapshot.val();
      const currentPlayerId = this.getCurrentPlayerId();
      if (!currentPlayerId || !players[currentPlayerId]) return;

      const playerData = players[currentPlayerId];
      switch (playerData.rollStatus) {
        case 'rolled':
          this.handlePlayerRoll(currentPlayerId);
          break;
        case 'animationPlayed':
          this.playDiceAnimation(playerData);
          break;
        default:
          break;
      }
    });
  }

  async handlePlayerRoll(playerId) {
    const diceValue = Math.floor(Math.random() * 6) + 1;
    const updates = {
      [`rooms/${this.roomId}/players/${playerId}/currentDiceValue`]: diceValue,
      [`rooms/${this.roomId}/players/${playerId}/rollStatus`]:
        'animationPlayed',
    };

    try {
      await update(ref(this.rtdb), updates);
    } catch (error) {
      console.error('更新骰子結果時出錯:', error);
    }
  }

  playDiceAnimation(playerData) {
    if (this.diceModule) {
      this.diceModule.playDiceAnimation(
        playerData.currentDiceValue,
        playerData.diceType
      );
      this.sounds.diceRoll.play().catch((e) => console.log('播放音效失敗:', e));
    }
  }

  async resetDiceStatus(playerId) {
    const updates = {
      [`rooms/${this.roomId}/players/${playerId}/rollStatus`]: null,
      [`rooms/${this.roomId}/players/${playerId}/currentDiceValue`]: 0,
    };

    try {
      await update(ref(this.rtdb), updates);
    } catch (error) {
      console.error('重置骰子狀態時出錯:', error);
    }
  }

  async startDiceRoll(playerId) {
    const updates = {
      [`rooms/${this.roomId}/players/${playerId}/rollStatus`]: 'connecting',
      [`rooms/${this.roomId}/players/${playerId}/currentDiceValue`]: 0,
    };

    try {
      await update(ref(this.rtdb), updates);
    } catch (error) {
      console.error('開始骰子連線時出錯:', error);
    }
  }

  async removeDiceRoll(playerId) {
    const updates = {
      [`rooms/${this.roomId}/players/${playerId}/rollStatus`]: 'idle',
      [`rooms/${this.roomId}/players/${playerId}/currentDiceValue`]: 0,
    };

    try {
      await update(ref(this.rtdb), updates);
    } catch (error) {
      console.error('骰子收回時出錯:', error);
    }
  }
}

$(document).ready(function () {
  let currentRoomData = null;
  let insuranceHandler;
  let savingsHandler;
  let settlementHandler;
  let settingsHandler;
  let cardDrawer;
  let selectors = {};
  let assetsManager; // 新增 assetsManager 變數

  // 設置視窗高度
  const setVH = () => {
    const vh = $(window).height() * 0.01;
    $(':root').css('--vh', `${vh}px`);
  };

  $(window).on('resize load', setVH);

  // 設置基礎 URL
  const hostname = window.location.hostname;
  const baseURL =
    hostname === '127.0.0.1' ||
    hostname === 'localhost' ||
    hostname === 'localhost' ||
    hostname.indexOf('ngrok-free.app/')
      ? window.location.origin
      : `${window.location.origin}/path-to-prosperity`;

  $('#dice-result').css({
    height: '50vh',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  });

  $('#content').show();

  // 檢查房間 ID
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room');

  if (!roomId) {
    alert('無效的教室代碼');
    return;
  }

  if (roomId != '1234') {
    alert('暫不開放其他教室');
    return;
  }

  // 初始化預載入器
  const preloader = new Preloader(baseURL);
  const sounds = preloader.getSounds();
  const imageSets = preloader.getImageSets();

  // 更新遊戲狀態函數
  const updateGameState = (field, value) => {
    const updates = {};

    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (
        parent === 'currentPlayer' &&
        currentRoomData?.gameState?.currentPlayer
      ) {
        updates[
          `rooms/${roomId}/players/${currentRoomData.gameState.currentPlayer}/${child}`
        ] = value;
      }
    } else {
      updates[`rooms/${roomId}/gameState/${field}`] = value;

      if (field === 'gameRound') {
        const roundData = gameRounds[value];
        updates[`rooms/${roomId}/gameState/currentEvent`] = roundData.event;
        updates[`rooms/${roomId}/gameState/currentIcon`] = roundData.icon;
      }
    }

    return update(ref(rtdb), updates)
      .then(() => {
        console.log(`成功更新 ${field} 為 ${value}`);
      })
      .catch((error) => {
        console.error(`更新 ${field} 時出錯:`, error);
      });
  };

  const adminAssetsManager = new AdminAssetsManager(
    rtdb,
    roomId,
    stocksData,
    housesData,
    stockRounds,
    houseRounds
  );

  const interestCounter = new InterestCounter(rtdb, roomId);
  const rentCounter = new RentCounter(rtdb, roomId, housesData, houseRounds);
  const dividendCounter = new DividendCounter(
    rtdb,
    roomId,
    stocksData,
    stockRounds
  );

  // 初始化房間監聽器
  const initializeRoomListener = () => {
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const roomDisplay = new RoomDisplay('#message-card');

    onValue(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          $('#message-card').html('<p>教室資料不存在。</p>');
          return;
        }

        const roomData = snapshot.val();
        currentRoomData = roomData;
        console.log('教室資料更新:', roomData);
        roomDisplay.displayRoomInfo(roomData);
        selectors.player.updatePlayerList(roomData);
        const currentStockRound = Number(roomData.gameState.stockRound);
        const currentHouseRound = Number(roomData.gameState.houseRound);
        currentStockRoundPriceChange =
          stockRounds[currentStockRound].priceChange;
        currentStockRoundDividendChange =
          stockRounds[currentStockRound].dividendChange;
        currentHouseRoundPriceChange =
          houseRounds[currentHouseRound].priceChange;
        if (cardDrawer) {
          cardDrawer.setCurrentStockRound(currentStockRound || 0);
          cardDrawer.setCurrentHouseRound(currentHouseRound || 0);
        }
        $(
          '#count-rent-button, #count-dividend-button, #count-interest-button'
        ).prop('disabled', true);
        const currentPlayerId = roomData.gameState.currentPlayer;
        const currentPlayerData = roomData.players[currentPlayerId];

        // 使用 AssetsManager 替換原有的資產相關函數調用
        assetsManager.renderPropertiesTable(
          currentPlayerData,
          currentPlayerId, // 傳遞當前玩家的 ID
          currentStockRoundPriceChange,
          currentStockRoundDividendChange,
          currentHouseRoundPriceChange
        );
        assetsManager.bindPropertyButtons(currentPlayerData);

        $('#last-dice-value').text(
          currentPlayerData.lastDiceValue
            ? `上次骰到的點數：${currentPlayerData.lastDiceValue}`
            : '請發送骰子給目前的玩家。'
        );

        toggleDiceButtons(currentPlayerData, currentPlayerId);
        toggleEventButtons(roomData.gameState.currentEvent);
        updateDiceTypeDisplay(roomData);

        $('#change-message-card, #change-message-card-modal').text(
          `股價 ${formatChange(
            currentStockRoundPriceChange
          )} / 股息 ${formatChange(
            currentStockRoundDividendChange
          )} / 房價 ${formatChange(currentHouseRoundPriceChange)}`
        );

        $('#currentSavingsMessage').html(
          `目前已存入 <span class="text-danger">${currentPlayerData.savings}</span> 元。`
        );

        insuranceHandler.setCurrentRoomData(roomData);
        savingsHandler.setCurrentRoomData(roomData);
        settlementHandler.setCurrentRoomData(roomData);
        adminAssetsManager.updateRoomData(roomData);
      },
      (error) => {
        console.error('監聽教室資料時出錯:', error);
        $('#message-card').html('<p>監聽教室資料時出錯，請稍後再試。</p>');
      }
    );
  };

  // 格式化變動數值
  const formatChange = (value) => (value >= 0 ? `+${value}` : value);

  // 切換骰子按鈕顯示
  const toggleDiceButtons = (playerData, currentPlayerId) => {
    const { rollStatus } = playerData;

    if (rollStatus === 'connecting' && currentPlayerId) {
      $('#dice-status').text(`請玩家 ${currentPlayerId} 點擊按鈕擲骰`);
      $('#remove-dice-button').show().prop('disabled', false);
      $('#add-dice-button').hide().prop('disabled', true);
    }

    if (rollStatus === 'rolled' || rollStatus === 'animationPlayed') {
      $('#remove-dice-button').hide().prop('disabled', true);
      $('#add-dice-button').hide().prop('disabled', true);
    } else if (rollStatus === 'idle' || rollStatus === 'completed') {
      $('#dice-status').text('尚未發送骰子');
      $('#remove-dice-button').hide().prop('disabled', true);
      $('#add-dice-button').show().prop('disabled', false);
    }
  };

  // 切換事件按鈕狀態
  const toggleEventButtons = (currentEvent) => {
    const eventMap = {
      '發放房屋租金 🏠': '#count-rent-button',
      '發放股票利息 📈': '#count-dividend-button',
      '發放儲蓄利息 🏦': '#count-interest-button',
    };

    Object.entries(eventMap).forEach(([event, selector]) => {
      $(selector).prop('disabled', currentEvent !== event);
    });
  };

  // 更新骰子類型顯示
  const updateDiceTypeDisplay = (roomData) => {
    const currentPlayerId = roomData.gameState.currentPlayer;
    if (currentPlayerId && roomData.players[currentPlayerId]) {
      const diceType = roomData.players[currentPlayerId].diceType;
      if (diceType === 1) {
        $('#btnradio1').prop('checked', true);
        $('#sell-assets-button').prop('disabled', true);
        $(
          '#sell-assets-button, #savings-button, #buy-insurance-button, #roll-dice-button'
        )
          .addClass('btn-danger')
          .addClass('text-light')
          .removeClass('btn-warning')
          .removeClass('text-dark');

        $('#btnradio1Label, #btnradio2Label')
          .addClass('btn-outline-danger')
          .removeClass('btn-outline-warning');
        $('#btnradio1Label').addClass('text-light').removeClass('text-warning');
        $('#btnradio2Label').addClass('text-danger').removeClass('text-dark');
      } else if (diceType === 2) {
        $('#btnradio2').prop('checked', true);
        $('#sell-assets-button').prop('disabled', false);
        $(
          '#sell-assets-button, #savings-button, #buy-insurance-button, #roll-dice-button'
        )
          .addClass('btn-warning')
          .addClass('text-dark')
          .removeClass('btn-danger')
          .removeClass('text-light');

        $('#btnradio1Label, #btnradio2Label')
          .addClass('btn-outline-warning')
          .removeClass('btn-outline-danger');
        $('#btnradio1Label').addClass('text-warning').removeClass('text-light');
        $('#btnradio2Label').addClass('text-dark').removeClass('text-danger');
      }
    }
  };

  // 初始化拖曳處理
  for (let i = 1; i <= 8; i++) {
    const $avatar = $(`#avatar-${i}`);
    if ($avatar.length) {
      new DragHandler($avatar);
    }
  }

  // 載入必要資源
  preloader.loadEssentialImages().then(() => {
    $('#loading').hide();
    $('#content').removeClass('d-none');
    $('#card-loading').hide();

    // 初始化 AssetsManager
    assetsManager = new AssetsManager(rtdb, roomId, stocksData, housesData);

    // 初始化選擇器
    selectors = {
      gameRound: new GameRoundSelector({
        sounds,
        gameRounds,
        updateGameState,
      }),
      stockRound: new StockRoundSelector({
        sounds,
        stockRounds,
        updateGameState,
      }),
      houseRound: new HouseRoundSelector({
        sounds,
        houseRounds,
        updateGameState,
      }),
      player: new PlayerSelector({
        updateGameState,
      }),
    };

    // 初始化卡片繪製器和保險處理器
    cardDrawer = new CardDrawer(baseURL, sounds, imageSets);
    insuranceHandler = new InsuranceHandler(rtdb, roomId);
    settingsHandler = new SettingsHandler(rtdb, roomId);
    savingsHandler = new SavingsHandler(rtdb, roomId);
    settlementHandler = new SettlementHandler(
      rtdb,
      roomId,
      stocksData,
      housesData,
      stockRounds,
      houseRounds
    );

    // 綁定卡片按鈕事件
    $('#stock-button').click(() => cardDrawer.drawCard('stock'));
    $('#house-button').click(() => cardDrawer.drawCard('house'));
    $('#risk-button').click(() => cardDrawer.drawCard('risk'));
    $('#game-button').click(() => cardDrawer.drawCard('game'));

    // 初始化房間監聽
    initializeRoomListener();
  });

  // 初始化模態框
  const assetsModal = new Modal(document.getElementById('assetsModal'));
  const buyInsuranceModal = new Modal(
    document.getElementById('buyInsuranceModal')
  );
  const rollDiceModal = new Modal(document.getElementById('rollDiceModal'));

  // 綁定事件處理器
  $('input[name="btnradio"]').on('change', function () {
    const selectedValue = $('input[name="btnradio"]:checked').attr('id');
    if (selectedValue === 'btnradio1') {
      updateGameState('currentPlayer.diceType', 1);
    } else if (selectedValue === 'btnradio2') {
      updateGameState('currentPlayer.diceType', 2);
    }
  });

  $('input[name="btnradio"]:checked').trigger('change');

  $('#sell-assets-button').click(() => assetsModal.show());

  $('#confirm-sell-assets').click(() => {
    const selectedAsset = $('#sellAssetSelect').val();
    const quantity = $('#sellQuantity').val();

    if (selectedAsset && quantity) {
      updateGameState('soldAssets', {
        asset: selectedAsset,
        quantity: parseInt(quantity, 10),
      });
      assetsModal.hide();
      alert('資產賣出成功！');
    } else {
      alert('請選擇資產並輸入數量。');
    }
  });

  const diceHandler = new DiceHandler(
    rtdb,
    roomId,
    sounds,
    () => currentRoomData?.gameState?.currentPlayer
  );

  // 綁定骰子按鈕事件
  $('#add-dice-button').click(() => {
    const currentPlayerId = currentRoomData.gameState.currentPlayer;
    if (currentPlayerId) {
      diceHandler.startDiceRoll(currentPlayerId);
    }
    $('#add-dice-button').hide();
    $('#remove-dice-button').show();
    $('#remove-dice-button').prop('disabled', false);
  });

  $('#remove-dice-button').click(() => {
    const currentPlayerId = currentRoomData.gameState.currentPlayer;
    if (currentPlayerId) {
      diceHandler.removeDiceRoll(currentPlayerId);
    }
    $('#add-dice-button').show();
    $('#remove-dice-button').hide();
  });

  $('#roll-dice-button').click(() => {
    rollDiceModal.show();

    const currentPlayerId = currentRoomData.gameState.currentPlayer;

    if (!diceHandler.diceModule) {
      diceHandler.diceModule = new DiceModule({
        rtdb,
        roomId,
        playerId: currentPlayerId,
        container: '#dice-result',
      });
    }
  });
});
