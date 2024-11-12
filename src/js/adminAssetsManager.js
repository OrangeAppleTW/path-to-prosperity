// src/js/adminAssetsManager.js

import { ref, update, onValue } from 'firebase/database';
import $ from 'jquery';
import Modal from 'bootstrap/js/dist/modal';

export class AdminAssetsManager {
  constructor(rtdb, roomId, stocksData, housesData, stockRounds, houseRounds) {
    this.rtdb = rtdb;
    this.roomId = roomId;
    this.stocksData = stocksData;
    this.housesData = housesData;
    this.stockRounds = stockRounds;
    this.houseRounds = houseRounds;

    // 添加價格變化追蹤
    this.currentStockPriceChange = 0;
    this.currentStockDividendChange = 0; // 如果有股息變動
    this.currentHousePriceChange = 0;

    this.modal = new Modal(document.getElementById('adminAssetsModal'));
    this.currentRoomData = null;

    this.history = []; // 操作歷史
    this.currentIndex = -1; // 當前歷史位置
    this.maxHistory = 20; // 最大歷史記錄數

    this.initializeSelectors();
    this.bindEvents();
    this.listenForRoomData(); // 監聽房間資料變更
    this.bindUndoRedoButtons();
  }

  initializeSelectors() {
    // 填充房屋選擇器
    this.housesData.forEach((house) => {
      $('#admin-house-select').append(
        `<option value="house-${house.id.substring(1)}">${house.id} - ${
          house.name
        }</option>`
      );
    });

    // 填充股票選擇器
    this.stocksData.forEach((stock) => {
      $('#admin-stock-select').append(
        `<option value="stock-${stock.id.substring(1)}">${stock.id} - ${
          stock.name
        }</option>`
      );
    });
  }

  bindEvents() {
    // 監聽選擇器變化
    $('#admin-house-select, #admin-stock-select, #admin-player-select').on(
      'change',
      () => {
        this.validateSelections();
      }
    );

    // 新增資產按鈕
    $('#admin-add-house-asset').click(() => this.handleAddAsset('house'));
    $('#admin-add-stock-asset').click(() => this.handleAddAsset('stock'));

    // 綁定管理按鈕
    $('#admin-button').click(() => {
      this.modal.show();
      this.renderAssetsList();
    });

    $('#admin-player-select').on('change', () => {
      this.renderAssetsList();
      this.validateSelections();
    });
  }

  formatDateTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return timeStr;
  }

  getNextPropertyId(properties) {
    if (!properties) return 1;

    // 提取並過濾純數字的 ID
    const propertyIds = Object.keys(properties)
      .map((id) => {
        const parsedId = parseInt(id, 10);
        if (isNaN(parsedId)) {
          console.warn(`忽略非數字的 property ID: ${id}`);
        }
        return parsedId;
      })
      .filter((id) => !isNaN(id));

    // 計算新的 ID
    const newId = propertyIds.length > 0 ? Math.max(...propertyIds) + 1 : 1;
    console.log(`生成的新 property ID: ${newId}`);
    return newId;
  }

  async handleAddAsset(type) {
    const playerId = $('#admin-player-select').val();
    let propertyId, buyPrice;

    const stockPriceChange = this.calculateStockPriceChange();
    const housePriceChange = this.calculateHousePriceChange();

    if (type === 'house') {
      propertyId = $('#admin-house-select').val();
      buyPrice =
        this.housesData.find((h) => 'house-' + h.id.substring(1) === propertyId)
          ?.price + housePriceChange;
    } else if (type === 'stock') {
      propertyId = $('#admin-stock-select').val();
      buyPrice =
        this.stocksData.find((s) => 'stock-' + s.id.substring(1) === propertyId)
          ?.price + stockPriceChange;
    }

    if (!playerId || !propertyId) return;

    const asset = {
      buyAt: Date.now(),
      buyPrice: buyPrice,
      property: propertyId,
      type: type,
    };

    try {
      const playerProperties =
        this.currentRoomData?.players?.[playerId]?.properties || {};
      const newPropertyId = this.getNextPropertyId(playerProperties);

      // 更新本地數據
      if (!this.currentRoomData.players[playerId].properties) {
        this.currentRoomData.players[playerId].properties = {};
      }
      this.currentRoomData.players[playerId].properties[newPropertyId] = asset;

      // 先更新數據庫
      await this.addAsset({
        playerId,
        propertyId: newPropertyId,
        asset,
      });

      // 添加到歷史記錄
      this.addToHistory({
        type: 'add',
        data: {
          playerId,
          propertyId: newPropertyId,
          asset,
        },
      });

      // 更新玩家選擇器的值並重新渲染資產列表
      //   $('#admin-player-select').val(playerId);
      this.renderAssetsList();

      // 重置相關選擇器
      if (type === 'house') {
        $('#admin-house-select').val('');
        $('#admin-add-house-asset').prop('disabled', true);
      } else if (type === 'stock') {
        $('#admin-stock-select').val('');
        $('#admin-add-stock-asset').prop('disabled', true);
      }

      console.log(`Added asset with propertyId: ${newPropertyId}`);
    } catch (error) {
      console.error('新增資產失敗:', error);
      alert('新增資產失敗，請稍後再試。');
    }
  }

  validateSelections() {
    const houseSelected = $('#admin-house-select').val();
    const stockSelected = $('#admin-stock-select').val();
    const playerSelected = $('#admin-player-select').val();

    $('#admin-add-house-asset').prop(
      'disabled',
      !houseSelected || !playerSelected
    );
    $('#admin-add-stock-asset').prop(
      'disabled',
      !stockSelected || !playerSelected
    );
  }

  bindAssetButtons() {
    // 先移除所有已存在的事件監聽器
    $('#admin-assets-list').off('click', '.remove-asset');
    $('#admin-assets-list').off('click', '.use-asset');

    // 重新綁定移除資產按鈕事件
    $('#admin-assets-list').on('click', '.remove-asset', async (e) => {
      const playerId = $(e.currentTarget).data('player-id');
      const propertyId = $(e.currentTarget).data('property-id');

      if (confirm('確定要移除此資產嗎？')) {
        try {
          // 獲取當前資產資料
          const property =
            this.currentRoomData.players[playerId].properties[propertyId];

          // 記錄操作到歷史
          this.addToHistory({
            type: 'remove',
            data: {
              playerId,
              propertyId,
              asset: { ...property }, // 保存完整的資產資料
            },
          });

          // 使用統一的移除方法
          await this.removeAsset({
            playerId,
            propertyId,
          });

          alert('資產已移除');
        } catch (error) {
          console.error('移除資產失敗:', error);
          alert('移除資產失敗，請稍後再試。');
        }
      }
    });

    // 重新綁定使用資產按鈕事件
    $('#admin-assets-list').on('click', '.use-asset', async (e) => {
      const playerId = $(e.currentTarget).data('player-id');
      const propertyId = $(e.currentTarget).data('property-id');

      if (confirm('確定要使用此資產嗎？')) {
        try {
          // 獲取當前資產資料
          const property =
            this.currentRoomData.players[playerId].properties[propertyId];

          // 記錄操作到歷史
          this.addToHistory({
            type: 'use',
            data: {
              playerId,
              propertyId,
              asset: { ...property }, // 保存完整的資產資料
            },
          });

          // 使用統一的使用方法
          await this.useAsset({
            playerId,
            propertyId,
          });

          alert('資產使用成功！');
        } catch (error) {
          console.error('使用資產失敗:', error);
          alert('使用資產失敗，請稍後再試。');
        }
      }
    });
  }

  listenForRoomData() {
    const roomRef = ref(this.rtdb, `rooms/${this.roomId}`);
    onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        this.updateRoomData(data);
      }
    });
  }

  calculateStockPriceChange() {
    const stockRound = this.currentRoomData?.gameState?.stockRound || 0;
    const stockRoundData = this.stockRounds[stockRound];
    return stockRoundData ? stockRoundData.priceChange : 0;
  }

  calculateHousePriceChange() {
    const houseRound = this.currentRoomData?.gameState?.houseRound || 0;
    const houseRoundData = this.houseRounds[houseRound];
    return houseRoundData ? houseRoundData.priceChange : 0;
  }

  getCurrentStockPriceChange(stockId) {
    const stock = this.stocksData.find((s) => s.id === `S${stockId}`);
    if (!stock) {
      console.warn(`未找到股票 ID: S${stockId}`);
      return 0;
    }
    // 使用 calculateStockPriceChange 來獲取當前價格變動
    return this.calculateStockPriceChange();
  }

  getCurrentHousePriceChange(houseId) {
    const house = this.housesData.find((h) => h.id === `H${houseId}`);
    if (!house) {
      console.warn(`未找到房屋 ID: H${houseId}`);
      return 0;
    }
    // 使用 calculateHousePriceChange 來獲取當前價格變動
    return this.calculateHousePriceChange();
  }

  updateRoomData(roomData) {
    this.currentRoomData = roomData;

    // 計算價格變動量
    this.currentStockPriceChange = this.calculateStockPriceChange();
    this.currentHousePriceChange = this.calculateHousePriceChange();

    // 保存當前選擇的玩家
    const currentSelectedPlayer = $('#admin-player-select').val();

    // 更新玩家選擇器
    const $playerSelect = $('#admin-player-select');
    $playerSelect.empty();

    if (roomData?.players) {
      const players = Object.entries(roomData.players)
        .filter(([_, playerData]) => playerData.joinedAt > 0)
        .sort(([idA], [idB]) => idA.localeCompare(idB));

      players.forEach(([playerId, playerData]) => {
        $playerSelect.append(
          `<option value="${playerId}">玩家：${
            playerData.name || playerId
          }</option>`
        );
      });

      // 如果有之前選擇的玩家，優先使用該玩家
      if (currentSelectedPlayer && roomData.players[currentSelectedPlayer]) {
        $playerSelect.val(currentSelectedPlayer);
      } else if (roomData.gameState?.currentPlayer) {
        $playerSelect.val(roomData.gameState.currentPlayer);
      }
    }

    // 更新資產列表顯示
    this.renderAssetsList();
  }

  renderAssetsList(specificPlayerId = null) {
    const currentSelectedPlayerId = $('#admin-player-select').val();
    const selectedPlayerId = specificPlayerId || currentSelectedPlayerId;

    if (
      !selectedPlayerId ||
      !this.currentRoomData?.players?.[selectedPlayerId]
    ) {
      $('#admin-assets-list').html('');
      return;
    }

    // 只在有指定 playerId 時才更新選擇器
    if (specificPlayerId) {
      $('#admin-player-select').val(selectedPlayerId);
    }

    const playerData = this.currentRoomData.players[selectedPlayerId];
    console.log('Rendering assets for player:', selectedPlayerId, playerData);
    let html = `<div class="table-responsive">
            <table class="table table-bordered">
              <thead class="table-secondary">
                <tr style="height: 48px" class="align-middle text-center">
                  <th class="align-middle col-1">類型</th>
                  <th class="align-middle col-3">資產名稱</th>
                  <th class="align-middle">購入時間</th>
                  <th class="align-middle">購入價格</th>
                  <th class="align-middle">目前價格</th>
                  <th class="align-middle">預期報酬</th>
                  <th class="align-middle">操作</th>
                </tr>
              </thead><tbody>`;

    // 計算價格變動量
    const stockPriceChange = this.calculateStockPriceChange();
    const housePriceChange = this.calculateHousePriceChange();

    if (playerData.properties) {
      // 過濾掉 soldAt > 0 的資產
      const properties = Object.entries(playerData.properties).filter(
        ([_, property]) =>
          !(property.soldAt && property.soldAt > 0) &&
          !(property.usedAt && property.usedAt > 0)
      );

      if (properties.length > 0) {
        properties.forEach(([propertyId, property]) => {
          console.log('Processing property:', propertyId, property);

          let assetData;
          let assetType;
          let currentPrice = '';
          let expectedReturn = '';

          if (property.type === 'stock') {
            assetData = this.stocksData.find(
              (s) => 'stock-' + s.id.substring(1) === property.property
            );
            assetType = '<span class="badge bg-warning text-white">股票</span>';
            if (assetData) {
              currentPrice = assetData.price + stockPriceChange;
              expectedReturn = currentPrice - property.buyPrice;
            } else {
              console.warn(`未找到股票資產 ID: ${property.property}`);
            }
          } else if (property.type === 'house') {
            assetData = this.housesData.find(
              (h) => 'house-' + h.id.substring(1) === property.property
            );
            assetType = '<span class="badge bg-danger text-white">房屋</span>';
            if (assetData) {
              currentPrice = assetData.price + housePriceChange;
              expectedReturn = currentPrice - property.buyPrice;
            } else {
              console.warn(`未找到房屋資產 ID: ${property.property}`);
            }
          } else if (property.type === 'insurance') {
            assetData = { name: '保險卡' };
            assetType = '<span class="badge bg-success text-white">保險</span>';
            // 保險可能沒有價格變動和預期報酬
          } else {
            console.warn(`未知的資產類型: ${property.type}`);
          }

          // 格式化購買時間
          const purchaseTime = this.formatDateTime(property.buyAt);

          // 格式化預期報酬顯示
          let expectedReturnDisplay = 'N/A';
          if (expectedReturn !== '') {
            expectedReturnDisplay =
              expectedReturn >= 0 ? `+${expectedReturn}` : `${expectedReturn}`;
          }

          html += `
            <tr>
              <td class="align-middle text-center">${assetType}</td>
              <td class="align-middle text-center">${
                assetData ? assetData.name : '未知資產'
              }</td>
              <td class="align-middle text-center">${purchaseTime}</td>
              <td class="align-middle text-end">${property.buyPrice}</td>
              <td class="align-middle text-end">${currentPrice}</td>
              <td class="align-middle text-end">${
                assetType.indexOf('保險') === -1 ? expectedReturnDisplay : ''
              }</td>
              <td class="align-middle text-center">
                ${
                  assetType.indexOf('保險') != -1
                    ? `<button class="btn btn-success btn-sm use-asset"
                        data-player-id="${selectedPlayerId}" 
                        data-property-id="${propertyId}">使用</button>`
                    : `<button
                        class="btn btn-danger btn-sm remove-asset text-light"
                        data-player-id="${selectedPlayerId}"
                        data-property-id="${propertyId}"
                      >
                        移除
                      </button>`
                }
              </td>
            </tr>
          `;
        });

        html += `
              </tbody>
            </table>
          </div>
        `;
      } else {
        html += '<p>沒有可顯示的資產。</p>';
      }
    }

    $('#admin-assets-list').html(html);

    // 綁定按鈕事件
    this.bindAssetButtons();
  }

  addToHistory(action) {
    // 如果當前不在歷史記錄的最後，刪除當前位置之後的記錄
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // 添加新的操作到歷史記錄
    this.history.push(action);

    // 如果超過最大記錄數，刪除最舊的記錄
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.currentIndex = this.history.length - 1;

    // 更新按鈕狀態
    this.updateUndoRedoButtons();
  }

  undo() {
    if (this.currentIndex >= 0) {
      const action = this.history[this.currentIndex];
      this.revertAction(action);
      this.currentIndex--;
      this.updateUndoRedoButtons();
    }
  }

  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      const action = this.history[this.currentIndex];
      this.applyAction(action);
      this.updateUndoRedoButtons();
    }
  }

  updateUndoRedoButtons() {
    $('#admin-assets-modal-undo-button').prop(
      'disabled',
      this.currentIndex < 0
    );
    $('#admin-assets-modal-redo-button').prop(
      'disabled',
      this.currentIndex >= this.history.length - 1
    );
  }

  bindUndoRedoButtons() {
    $('#admin-assets-modal-undo-button').click(() => this.undo());
    $('#admin-assets-modal-redo-button').click(() => this.redo());
  }

  // 處理操作的應用和回退
  async applyAction(action) {
    try {
      switch (action.type) {
        case 'add':
          await this.addAsset(action.data);
          break;
        case 'remove':
          await this.removeAsset(action.data);
          break;
        case 'use':
          await this.useAsset(action.data);
          break;
      }
    } catch (error) {
      console.error('應用操作失敗:', error);
    }
  }

  async revertAction(action) {
    try {
      switch (action.type) {
        case 'add':
          await this.removeAsset(action.data);
          break;
        case 'remove':
          await this.addAsset(action.data);
          break;
        case 'use':
          await this.revertUseAsset(action.data);
          break;
      }
    } catch (error) {
      console.error('回退操作失敗:', error);
    }
  }

  async addAsset(data) {
    const { playerId, propertyId, asset } = data;
    const updates = {};
    updates[
      `rooms/${this.roomId}/players/${playerId}/properties/${propertyId}`
    ] = asset;

    try {
      await update(ref(this.rtdb), updates);
      this.renderAssetsList(playerId);
    } catch (error) {
      console.error('添加資產失敗:', error);
      throw error;
    }
  }

  async removeAsset(data) {
    const { playerId, propertyId } = data;
    const updates = {};
    const propertyPath = `rooms/${this.roomId}/players/${playerId}/properties/${propertyId}`;
    const soldAt = Date.now();
    const soldPrice = 0;

    updates[`${propertyPath}/soldAt`] = soldAt;
    updates[`${propertyPath}/soldPrice`] = soldPrice;

    try {
      await update(ref(this.rtdb), updates);
      // 使用特定的 playerId 重新渲染列表
      this.renderAssetsList(playerId);
    } catch (error) {
      console.error('移除資產失敗:', error);
      throw error;
    }
  }

  async useAsset(data) {
    const { playerId, propertyId } = data;
    const updates = {};
    const propertyPath = `rooms/${this.roomId}/players/${playerId}/properties/${propertyId}`;
    const usedAt = Date.now();

    updates[`${propertyPath}/usedAt`] = usedAt;

    try {
      await update(ref(this.rtdb), updates);
      this.renderAssetsList(playerId);
    } catch (error) {
      console.error('使用資產失敗:', error);
      throw error;
    }
  }

  async revertUseAsset(data) {
    const { playerId, propertyId } = data;
    const updates = {};
    const propertyPath = `rooms/${this.roomId}/players/${playerId}/properties/${propertyId}`;

    updates[`${propertyPath}/usedAt`] = 0;

    try {
      await update(ref(this.rtdb), updates);
      this.renderAssetsList();
    } catch (error) {
      console.error('回復使用資產失敗:', error);
      throw error;
    }
  }
}
