// src/js/assetsManager.js

import { ref, update } from 'firebase/database';
import $ from 'jquery';

export class AssetsManager {
  constructor(db, roomId, stocksData, housesData) {
    this.db = db;
    this.roomId = roomId;
    this.stocksData = stocksData;
    this.housesData = housesData;

    // 添加價格變化追踪
    this.currentStockPriceChange = 0;
    this.currentStockDividendChange = 0;
    this.currentHousePriceChange = 0;

    this.isUpdating = false;
    this.playerId = null; // 新增：用於存儲當前玩家的 ID
  }

  renderPropertiesTable(
    playerData,
    playerId, // 新增：接受 playerId 作為參數
    stockPriceChange,
    stockDividendChange,
    housePriceChange
  ) {
    // 更新當前價格變化
    this.currentStockPriceChange = stockPriceChange;
    this.currentStockDividendChange = stockDividendChange;
    this.currentHousePriceChange = housePriceChange;

    this.playerId = playerId; // 存儲當前的玩家 ID

    const stocksMap = new Map(
      this.stocksData.map((stock) => [stock.id.substring(1), stock])
    );
    const housesMap = new Map(
      this.housesData.map((house) => [house.id.substring(1), house])
    );

    // 初始化表格 HTML
    let heldTableHtml = this._generateTableHeader('held');
    let soldTableHtml = this._generateTableHeader('sold');

    // 確保表格內容清空，避免重複渲染導致混亂
    $('#held-properties-sec').empty();
    $('#sold-properties-sec').empty();

    if (playerData.properties) {
      // 將資產分為持有和已賣出兩組
      const heldProperties = [];
      const soldProperties = [];

      Object.entries(playerData.properties).forEach(([key, property]) => {
        if (property.type === 'insurance') return;

        if (property.soldAt && property.soldAt > 0) {
          soldProperties.push([key, property]);
        } else {
          heldProperties.push([key, property]);
        }
      });

      // 持有中資產按照 buyAt 排序
      heldProperties.sort(([, a], [, b]) => a.buyAt - b.buyAt);

      // 已賣出資產按照 soldAt 排序
      soldProperties.sort(([, a], [, b]) => a.soldAt - b.soldAt);

      // 生成持有中資產的表格行
      for (const [key, property] of heldProperties) {
        const row = this._generatePropertyRow(
          property,
          key,
          stocksMap,
          housesMap,
          stockPriceChange,
          housePriceChange
        );
        heldTableHtml += row;
      }
      // 生成已賣出資產的表格行
      for (const [key, property] of soldProperties) {
        const row = this._generatePropertyRow(
          property,
          key,
          stocksMap,
          housesMap,
          stockPriceChange,
          housePriceChange
        );
        soldTableHtml += row;
      }
      if (heldProperties.length == 0) {
        heldTableHtml += `
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
      if (soldProperties.length == 0) {
        soldTableHtml += `
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
    } else {
      heldTableHtml += `
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

      soldTableHtml += `
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

    heldTableHtml += '</tbody></table>';
    soldTableHtml += '</tbody></table>';

    $('#held-properties-sec').html(heldTableHtml);
    $('#sold-properties-sec').html(soldTableHtml);

    // 綁定事件
    this.bindPropertyButtons(playerData);
  }

  bindPropertyButtons(playerData) {
    this._bindSellButton(playerData);
    this._bindRestoreButton(playerData);
  }

  _generateTableHeader(type) {
    const isHeld = type === 'held';
    return `
    <table class="table m-0 table-bordered">
      <thead>
        <tr class="text-center ${
          isHeld ? 'table-primary' : 'table-secondary'
        }" style="height: 48px">
          <th class="align-middle col-1">類型</th> 
          <th class="align-middle col-3">資產名稱</th>
          <th class="align-middle">${isHeld ? '購入時間' : '賣出時間'}</th>
          <th class="align-middle">購入價格</th>
          <th class="align-middle">${isHeld ? '目前價格' : '賣出價格'}</th>
          <th class="align-middle">${isHeld ? '預期' : '實現'}報酬</th>
          <th class="align-middle">操作按鈕</th>
        </tr>
      </thead>
      <tbody>
  `;
  }

  _generatePropertyRow(
    property,
    key,
    stocksMap,
    housesMap,
    stockPriceChange,
    housePriceChange
  ) {
    const assetId = property.property.split('-').pop();
    const isStock = property.type === 'stock';
    const assetMap = isStock ? stocksMap : housesMap;
    const assetData = assetMap.get(assetId);

    if (!assetData) return '';

    const currentPriceChange = isStock ? stockPriceChange : housePriceChange;
    const currentPrice = assetData.price + currentPriceChange;

    let sellPrice;
    if (property.soldAt && property.soldAt > 0) {
      sellPrice = property.soldPrice;
    } else {
      sellPrice = currentPrice;
    }

    // 格式化時間
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    };

    const timeDisplay =
      property.soldAt && property.soldAt > 0
        ? formatTime(property.soldAt)
        : formatTime(property.buyAt);

    const rawExpectedReturn = sellPrice - property.buyPrice;
    const expectedReturn =
      rawExpectedReturn > 0 ? `+${rawExpectedReturn}` : `${rawExpectedReturn}`;

    const assetBadge = isStock
      ? '<span class="badge bg-warning text-dark">股票</span>'
      : '<span class="badge bg-danger text-dark">房屋</span>';

    const buttonClass =
      property.soldAt && property.soldAt > 0 ? 'restore' : 'sell';
    const buttonText = property.soldAt && property.soldAt > 0 ? '恢復' : '賣出';
    const buttonStyle =
      property.soldAt && property.soldAt > 0 ? 'success' : 'danger';

    return `
        <tr>
        <td class="align-middle text-center">${assetBadge}</td>
        <td class="align-middle text-center">${assetData.name}</td>
        <td class="align-middle text-center">${timeDisplay}</td>
        <td class="align-middle text-center">${property.buyPrice}</td>
        <td class="align-middle text-center">${sellPrice}</td>
        <td class="align-middle text-center">${expectedReturn}</td>
        <td class="text-center">
            <button type="button" 
                    class="btn btn-${buttonStyle} btn-sm text-white ${buttonClass}-button" 
                    data-id="${key}" 
                    data-type="${property.type}">
            ${buttonText}
            </button>
        </td>
        </tr>
    `;
  }

  _bindSellButton(playerData) {
    $('#held-properties-sec').off('click', '.sell-button');

    $('#held-properties-sec').on('click', '.sell-button', async (e) => {
      const propertyId = $(e.currentTarget).data('id');

      if (
        !playerData.properties?.[propertyId] ||
        playerData.properties[propertyId].soldAt > 0
      ) {
        alert('該資產已售出或不存在');
        return;
      }

      // 取得資產相關資訊
      const property = playerData.properties[propertyId];
      const assetId = property.property.split('-').pop();
      const isStock = property.type === 'stock';
      const assetMap = isStock
        ? new Map(
            this.stocksData.map((stock) => [stock.id.substring(1), stock])
          )
        : new Map(
            this.housesData.map((house) => [house.id.substring(1), house])
          );
      const assetData = assetMap.get(assetId);
      const currentPriceChange = isStock
        ? this.currentStockPriceChange
        : this.currentHousePriceChange;
      const sellPrice = assetData.price + currentPriceChange;

      // 修改確認訊息
      if (
        confirm(
          `賣出「${assetData.name}」可以獲得 ${sellPrice} 元，確定要賣出嗎？`
        )
      ) {
        try {
          await this._updatePropertyStatus(
            propertyId,
            Date.now(),
            sellPrice,
            this.playerId,
            playerData
          );
          // 修改成功提示訊息
          alert(`已賣出「${assetData.name}」，請向銀行領取 ${sellPrice} 元！`);
        } catch (error) {
          console.error('賣出資產時發生錯誤:', error);
          alert('資產賣出失敗，請稍後再試。');
        }
      }
    });
  }

  _bindRestoreButton(playerData) {
    $('#sold-properties-sec')
      .off('click', '.restore-button')
      .on('click', '.restore-button', async (e) => {
        const propertyId = $(e.currentTarget).data('id');

        if (playerData.properties && playerData.properties[propertyId]) {
          try {
            await this._updatePropertyStatus(
              propertyId,
              0,
              null,
              this.playerId, // 使用存儲的 playerId
              playerData
            );
            alert('資產恢復成功！');
          } catch (error) {
            console.error('更新 soldAt 時出錯:', error);
            alert('資產恢復失敗，請稍後再試。');
          }
        }
      });
  }

  async _updatePropertyStatus(
    propertyId,
    soldAtValue,
    soldPrice,
    playerId,
    playerData
  ) {
    if (this.isUpdating) {
      alert('請等待當前操作完成');
      return;
    }
    this.isUpdating = true;
    try {
      const updates = {};
      const propertyPath = `rooms/${this.roomId}/players/${playerId}/properties/${propertyId}`;

      // 深度複製資料
      const propertyData = JSON.parse(
        JSON.stringify(playerData.properties[propertyId])
      );
      propertyData.soldAt = soldAtValue;

      if (soldAtValue > 0 && soldPrice != null) {
        // 賣出資產，記錄 soldPrice
        propertyData.soldPrice = soldPrice;
      } else if (soldAtValue === 0) {
        // 恢復資產，移除 soldPrice
        delete propertyData.soldPrice;
      }

      updates[propertyPath] = propertyData;

      // 等待 Firebase 更新完成
      await update(ref(this.db), updates);

      // 更新本地數據
      playerData.properties[propertyId] = propertyData;

      // 重新渲染
      this.renderPropertiesTable(
        playerData,
        playerId, // 傳遞 playerId
        this.currentStockPriceChange,
        this.currentStockDividendChange,
        this.currentHousePriceChange
      );

      // 重新綁定事件
      this.bindPropertyButtons(playerData);

      return true;
    } catch (error) {
      console.error('Error updating property status:', error);
      throw error;
    } finally {
      this.isUpdating = false;
    }
  }

  // 公共方法：取得資產總值
  getTotalAssetValue(playerData, stockPriceChange, housePriceChange) {
    let total = 0;
    const stocksMap = new Map(
      this.stocksData.map((stock) => [stock.id.substring(1), stock])
    );
    const housesMap = new Map(
      this.housesData.map((house) => [house.id.substring(1), house])
    );

    if (playerData.properties) {
      for (const property of Object.values(playerData.properties)) {
        if (
          property.type === 'insurance' ||
          (property.soldAt && property.soldAt > 0)
        )
          continue;

        const assetId = property.property.split('-').pop();
        const isStock = property.type === 'stock';
        const assetMap = isStock ? stocksMap : housesMap;
        const assetData = assetMap.get(assetId);

        if (assetData) {
          const currentPriceChange = isStock
            ? stockPriceChange
            : housePriceChange;
          const currentValue = assetData.price + currentPriceChange;
          total += currentValue;
        }
      }
    }

    return total;
  }

  // 公共方法：取得特定類型資產清單
  getAssetsByType(playerData, type) {
    const assets = [];
    const assetMap = new Map(
      (type === 'stock' ? this.stocksData : this.housesData).map((asset) => [
        asset.id.substring(1),
        asset,
      ])
    );

    if (playerData.properties) {
      for (const [key, property] of Object.entries(playerData.properties)) {
        if (property.type !== type || (property.soldAt && property.soldAt > 0))
          continue;

        const assetId = property.property.split('-').pop();
        const assetData = assetMap.get(assetId);

        if (assetData) {
          assets.push({
            id: key,
            ...property,
            assetData,
          });
        }
      }
    }

    return assets;
  }
}
