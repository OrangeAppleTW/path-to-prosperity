// src/js/cardDrawer.js

import rounds from '../data/rounds.json';
import Modal from 'bootstrap/js/dist/modal';
import { ref, onValue, runTransaction } from 'firebase/database';
import { db } from './common';

export class CardDrawer {
  constructor(baseURL, sounds, imageSets) {
    this.baseURL = baseURL;
    this.sounds = sounds;
    this.imageSets = imageSets;
    this.isAnimating = false;
    this.modal = null;
    this.preloadedImages = null;
    this.currentPrefix = null;
    this.currentSound = null;
    this.cardCount = null;
    this.isProcessingPurchase = false;
    this.currentStockRoundIndex = 0;
    this.currentHouseRoundIndex = 0;
    this.selectedCard = null;
    this.currentCardType = null;
    this.buyCardButton = null;
    this.roomData = null;

    if (!this.sounds) {
      console.warn('Sounds object is not properly initialized');
      this.sounds = {};
    }

    this.cardTypes = {
      stock: { count: 36, prefix: 'stock', sound: 'drawStockCardSound' },
      house: { count: 20, prefix: 'house', sound: 'drawHouseCardSound' },
      risk: { count: 28, prefix: 'risk', sound: 'drawRiskCardSound' },
      game: { count: 5, prefix: 'game', sound: 'drawGameCardSound' },
    };

    // 初始化 Modal
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () =>
        this.initializeModal()
      );
    } else {
      this.initializeModal();
    }

    // 獲取房間ID並設置數據庫監聽
    const urlParams = new URLSearchParams(window.location.search);
    this.roomId = urlParams.get('room');

    if (this.roomId) {
      const roomRef = ref(db, `rooms/${this.roomId}`);
      onValue(roomRef, (snapshot) => {
        if (snapshot.exists()) {
          this.roomData = snapshot.val();
          this.currentStockRoundIndex = this.roomData.gameState.stockRound || 0;
          this.currentHouseRoundIndex = this.roomData.gameState.houseRound || 0;
          this.updateBuyButtonState();
        }
      });
    }
  }

  setCurrentStockRound(index) {
    this.currentStockRoundIndex = index;
  }

  setCurrentHouseRound(index) {
    this.currentHouseRoundIndex = index;
  }

  initializeModal() {
    if (this.modal) return;

    let modalElement = document.getElementById('drawCardModal');

    if (!modalElement) {
      const modalHTML = `
        <div class="modal fade" id="drawCardModal" tabindex="-1" aria-labelledby="drawCardModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title text-dark" id="drawCardModalLabel">抽卡介面</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body text-center">
                <div id="card-result" style="height: 50vh; display: flex; justify-content: center; position: relative;">
                  <img id="card-image" src="" alt="Card" class="img-fluid" style="width: auto; height: 100%; opacity: 1; transition: opacity 0.3s ease-in-out;">
                  <img id="card-image-2" src="" alt="Card" class="img-fluid" style="width: auto; height: 100%; opacity: 0; transition: opacity 0.3s ease-in-out; display: none;">
                </div>
                <div id="card-info" class="mt-3"></div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-success" id="startDrawButton">抽一張</button>
                <button type="button" class="btn btn-danger text-light" id="drawTwoButton">抽二張</button>
                <button type="button" class="btn btn-danger text-light" id="buyCardButton" disabled>購買</button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      modalElement = document.getElementById('drawCardModal');
    }

    try {
      this.modal = new Modal(modalElement, {
        backdrop: true,
        keyboard: true,
        focus: true,
      });

      this.setupModalEventListeners(modalElement);
    } catch (error) {
      console.error('Modal initialization error:', error);
    }
  }

  setupModalEventListeners(modalElement) {
    modalElement.addEventListener('hide.bs.modal', (event) => {
      if (this.isAnimating) {
        event.preventDefault();
      }
    });

    modalElement.addEventListener('hidden.bs.modal', () => {
      if (this.buyCardButton) {
        this.buyCardButton.disabled = true;
      }
      const cardImage1 = document.getElementById('card-image');
      const cardImage2 = document.getElementById('card-image-2');
      if (cardImage1) cardImage1.style.opacity = 1;
      if (cardImage2) {
        cardImage2.style.opacity = 0;
        cardImage2.style.display = 'none'; // 重置為隱藏狀態
      }
      this.toggleModalSize(false);
    });

    // 設置按鈕事件監聽
    const startDrawButton = document.getElementById('startDrawButton');
    const drawTwoButton = document.getElementById('drawTwoButton');
    const buyCardButton = document.getElementById('buyCardButton');

    if (startDrawButton) {
      startDrawButton.addEventListener('click', () => this.handleStartDraw());
    }

    if (drawTwoButton) {
      drawTwoButton.style.display = 'none';
      drawTwoButton.addEventListener('click', () => this.startDrawTwoCards());
    }

    if (buyCardButton) {
      buyCardButton.addEventListener('click', () => this.handleBuyCard());
      this.buyCardButton = buyCardButton;
    }
  }

  handleStartDraw() {
    this.toggleModalSize(false);
    const startDrawButton = document.getElementById('startDrawButton');
    const drawTwoButton = document.getElementById('drawTwoButton');

    if (startDrawButton) {
      startDrawButton.disabled = true;
    }
    if (drawTwoButton) {
      drawTwoButton.disabled = true;
    }

    if (this.buyCardButton) {
      this.buyCardButton.disabled = true;
    }

    if (this.preloadedImages) {
      const randomCard = Math.floor(Math.random() * this.cardCount) + 1;
      this.startCardAnimation(
        this.preloadedImages,
        this.cardCount,
        this.currentPrefix,
        randomCard,
        this.currentSound
      );
    }
  }

  drawCard(type) {
    if (!this.cardTypes[type]) {
      console.error('無效的卡片類型');
      return;
    }

    const { count, prefix, sound } = this.cardTypes[type];
    const soundEffect = this.sounds[sound];

    if (!soundEffect) {
      console.warn(`Sound effect ${sound} not found`);
    }

    this.currentPrefix = prefix;
    this.cardCount = count;
    this.currentSound = soundEffect;
    this.currentCardType = type;

    this.preloadAndShowCards(prefix, count, soundEffect);
    this.updateDrawTwoButton(type);
    this.updateBuyButtonVisibility(type);
  }

  updateDrawTwoButton(type) {
    const drawTwoButton = document.getElementById('drawTwoButton');
    if (drawTwoButton) {
      drawTwoButton.style.display = type === 'risk' ? 'inline-block' : 'none';
    }
  }

  updateBuyButtonVisibility(type) {
    if (this.buyCardButton) {
      const shouldShow = type === 'stock' || type === 'house';
      this.buyCardButton.style.display = shouldShow ? 'inline-block' : 'none';
    }
  }

  async handleBuyCard() {
    if (!this.canBuyCard()) {
      alert('請先抽卡再購買');
      return;
    }

    if (!this.roomId || !this.roomData) {
      alert('找不到房間資料');
      return;
    }

    this.isProcessingPurchase = true;

    try {
      const currentPlayerId = this.roomData.gameState.currentPlayer;
      if (!currentPlayerId) {
        throw new Error('找不到當前玩家');
      }

      const cardData = this.getCardData();
      if (!cardData) {
        throw new Error('找不到卡片資料');
      }

      const currentPrice = this.getCurrentCardPrice();
      const confirmed = await this.confirmPurchase(cardData.name, currentPrice);

      if (!confirmed) {
        return;
      }

      await this.executePurchase(currentPlayerId, currentPrice);

      alert('購買成功！');
      this.modal?.hide();
    } catch (error) {
      alert(`購買失敗: ${error.message}`);
      console.error('Purchase error:', error);
    } finally {
      this.isProcessingPurchase = false;
      if (this.buyCardButton) {
        this.buyCardButton.disabled = true;
      }
    }
  }

  canBuyCard() {
    return (
      this.selectedCard &&
      this.currentCardType &&
      !this.isProcessingPurchase &&
      this.roomId &&
      this.roomData?.gameState?.currentPlayer
    );
  }

  updateBuyButtonState() {
    if (this.buyCardButton) {
      this.buyCardButton.disabled = !this.canBuyCard();
    }
  }

  getCardData() {
    if (this.currentCardType === 'stock') {
      return rounds.stocksData.find(
        (card) => card.id === `S${this.selectedCard}`
      );
    } else if (this.currentCardType === 'house') {
      return rounds.housesData.find(
        (card) => card.id === `H${this.selectedCard}`
      );
    }
    return null;
  }

  async confirmPurchase(cardName, price) {
    return confirm(
      `要購買「${cardName}」的話，需支付 ${price} 元，請支付給銀行唷！`
    );
  }

  async executePurchase(playerId, price) {
    const roomRef = ref(db, `rooms/${this.roomId}`);

    return runTransaction(roomRef, (currentData) => {
      if (!currentData) return;

      const player = currentData.players[playerId];
      if (!player.properties) {
        player.properties = {};
      }

      const newPropertiesId = this.getNextPropertyId(player.properties);

      player.properties[newPropertiesId] = {
        type: this.currentCardType,
        property: `${this.currentCardType}-${this.selectedCard}`,
        buyPrice: price,
        buyAt: Date.now(),
        soldAt: 0,
      };

      return currentData;
    });
  }

  getNextPropertyId(properties) {
    const propertyIds = Object.keys(properties).map((id) => parseInt(id, 10));
    return propertyIds.length > 0 ? Math.max(...propertyIds) + 1 : 1;
  }

  getCurrentCardPrice() {
    if (this.currentCardType === 'stock') {
      const cardData = rounds.stocksData.find(
        (card) => card.id === `S${this.selectedCard}`
      );
      const roundData = rounds.stockRounds[this.currentStockRoundIndex];
      return cardData.price + roundData.priceChange;
    } else if (this.currentCardType === 'house') {
      const cardData = rounds.housesData.find(
        (card) => card.id === `H${this.selectedCard}`
      );
      const roundData = rounds.houseRounds[this.currentHouseRoundIndex];
      return cardData.price + roundData.priceChange;
    }
    return 0;
  }

  preloadAndShowCards(prefix, count, sound) {
    const images = [];
    const imageLoadPromises = [];

    for (let i = 1; i <= count; i++) {
      const img = new Image();
      const promise = new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      img.src = `${this.baseURL}/assets/images/${prefix}-${i}.png`;
      images.push(img);
      imageLoadPromises.push(promise);
    }

    Promise.all(imageLoadPromises)
      .then(() => {
        this.preloadedImages = images;
        const cardImage = document.getElementById('card-image');
        if (cardImage && images.length > 0) {
          cardImage.src = images[0].src;
        }

        const cardInfo = document.getElementById('card-info');
        if (cardInfo) {
          cardInfo.innerHTML = `<p>點擊抽卡按鈕</p>`;
        }

        const startDrawButton = document.getElementById('startDrawButton');
        if (startDrawButton) {
          startDrawButton.disabled = false;
        }

        if (this.modal) {
          this.modal.show();
        }
      })
      .catch((error) => {
        console.error('Image preload error:', error);
      });
  }

  startCardAnimation(images, count, prefix, selectedCard, sound) {
    this.isAnimating = true;
    const startDrawButton = document.getElementById('startDrawButton');
    const drawTwoButton = document.getElementById('drawTwoButton');

    if (startDrawButton) {
      startDrawButton.disabled = true;
    }
    if (drawTwoButton) {
      drawTwoButton.disabled = true;
    }
    if (this.buyCardButton) {
      this.buyCardButton.disabled = true;
    }

    const cardInfo = document.getElementById('card-info');
    if (cardInfo) {
      cardInfo.innerHTML = `<p>點擊抽卡按鈕</p>`;
    }

    let currentIndex = 0;
    const cardImage = document.getElementById('card-image');
    const cardImage2 = document.getElementById('card-image-2');
    if (cardImage2) cardImage2.style.opacity = 0;

    let shuffleInterval;

    const finishAnimation = () => {
      if (shuffleInterval) {
        clearInterval(shuffleInterval);
      }

      if (cardImage) {
        cardImage.style.opacity = 0;
        setTimeout(() => {
          cardImage.src = `${this.baseURL}/assets/images/${prefix}-${selectedCard}.png`;
          cardImage.style.opacity = 1;
        }, 300);
      }

      let cardData = null;
      if (prefix === 'stock') {
        cardData = rounds.stocksData.find(
          (card) => card.id === `S${selectedCard}`
        );
        if (cardData && cardInfo) {
          const roundData = rounds.stockRounds[this.currentStockRoundIndex];
          const priceChange = roundData.priceChange;
          const currentPrice = cardData.price + priceChange;

          const formattedPriceChange =
            priceChange >= 0 ? `+${priceChange}` : `${priceChange}`;

          cardInfo.innerHTML = `
          <p>股票階段：${
            this.roomData?.gameState?.stockRound || 0
          } / 漲跌幅：${formattedPriceChange} / <span class="text-danger">目前價格：${currentPrice}</span></p>
        `;
        }
      } else if (prefix === 'house') {
        cardData = rounds.housesData.find(
          (card) => card.id === `H${selectedCard}`
        );
        if (cardData && cardInfo) {
          const roundData = rounds.houseRounds[this.currentHouseRoundIndex];
          const priceChange = roundData.priceChange;
          const currentPrice = cardData.price + priceChange;
          const formattedPriceChange =
            priceChange >= 0 ? `+${priceChange}` : `${priceChange}`;

          cardInfo.innerHTML = `
          <p>房屋階段：${
            this.roomData?.gameState?.houseRound || 0
          } / 漲跌幅：${formattedPriceChange} / 目前價格：${currentPrice}</p>
        `;
        }
      }

      this.isAnimating = false;
      if (startDrawButton) {
        startDrawButton.disabled = false;
      }
      if (drawTwoButton) {
        drawTwoButton.disabled = false;
      }

      this.selectedCard = selectedCard;
      this.currentCardType = prefix;

      if (this.buyCardButton) {
        this.buyCardButton.disabled = false;
      }

      if (sound) {
        sound.removeEventListener('ended', finishAnimation);
      }
    };

    shuffleInterval = setInterval(() => {
      if (cardImage) {
        cardImage.style.opacity = 0;
        setTimeout(() => {
          cardImage.src = images[currentIndex].src;
          cardImage.style.opacity = 1;
        }, 300);
      }
      currentIndex = (currentIndex + 1) % count;
    }, 100);

    if (sound) {
      sound.currentTime = 0;
      sound.play();
      sound.addEventListener('ended', finishAnimation);
    } else {
      setTimeout(finishAnimation, 3000);
    }
  }

  startDrawTwoCards() {
    if (!this.preloadedImages || this.isAnimating) return;

    this.toggleModalSize(true); // 切換為雙張版型
    this.isAnimating = true;
    const startDrawButton = document.getElementById('startDrawButton');
    const drawTwoButton = document.getElementById('drawTwoButton');
    if (startDrawButton) startDrawButton.disabled = true;
    if (drawTwoButton) drawTwoButton.disabled = true;

    // 隨機選擇兩張不同的卡片
    const firstCard = Math.floor(Math.random() * this.cardCount) + 1;
    let secondCard;
    do {
      secondCard = Math.floor(Math.random() * this.cardCount) + 1;
    } while (secondCard === firstCard);

    const cardImage1 = document.getElementById('card-image');
    const cardImage2 = document.getElementById('card-image-2');

    // 設置初始狀態
    if (cardImage2) {
      cardImage2.style.display = 'block';
      cardImage2.style.opacity = 1;
    }

    let currentIndex = 0;
    const shuffleInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * this.cardCount);
      if (cardImage1) {
        cardImage1.src = this.preloadedImages[randomIndex].src;
      }
      if (cardImage2) {
        cardImage2.src =
          this.preloadedImages[(randomIndex + 1) % this.cardCount].src;
      }
      currentIndex++;
    }, 100);

    if (this.currentSound) {
      this.currentSound.currentTime = 0;
      this.currentSound.play();

      // 監聽音效結束事件
      this.currentSound.addEventListener(
        'ended',
        () => {
          clearInterval(shuffleInterval);

          // 顯示最終結果
          if (cardImage1) {
            cardImage1.src = `${this.baseURL}/assets/images/${this.currentPrefix}-${firstCard}.png`;
          }
          if (cardImage2) {
            cardImage2.src = `${this.baseURL}/assets/images/${this.currentPrefix}-${secondCard}.png`;
          }

          this.isAnimating = false;
          if (startDrawButton) startDrawButton.disabled = false;
          if (drawTwoButton) drawTwoButton.disabled = false;
        },
        { once: true }
      ); // 確保事件監聽器只執行一次
    } else {
      // 如果沒有音效，使用計時器
      setTimeout(() => {
        clearInterval(shuffleInterval);

        // 顯示最終結果
        if (cardImage1) {
          cardImage1.src = `${this.baseURL}/assets/images/${this.currentPrefix}-${firstCard}.png`;
        }
        if (cardImage2) {
          cardImage2.src = `${this.baseURL}/assets/images/${this.currentPrefix}-${secondCard}.png`;
        }

        this.isAnimating = false;
        if (startDrawButton) startDrawButton.disabled = false;
        if (drawTwoButton) drawTwoButton.disabled = false;
      }, 3000);
    }
  }

  toggleModalSize(isLarge) {
    const modalDialog = document.querySelector('#drawCardModal .modal-dialog');
    const cardImage2 = document.getElementById('card-image-2');

    if (modalDialog) {
      if (isLarge) {
        modalDialog.classList.add('modal-lg');
        if (cardImage2) {
          cardImage2.style.display = 'block';
        }
      } else {
        modalDialog.classList.remove('modal-lg');
        if (cardImage2) {
          cardImage2.style.display = 'none';
        }
      }
    }
  }
}
