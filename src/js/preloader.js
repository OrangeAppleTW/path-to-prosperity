// src/js/preloader.js
export class Preloader {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.sounds = this.initSounds();
    this.imageSets = this.initImageSets();
  }

  initSounds() {
    const sounds = {
      drawStockCardSound: new Audio('assets/sounds/draw_stock_cards.mp3'),
      drawHouseCardSound: new Audio('assets/sounds/draw_house_cards.mp3'),
      drawRiskCardSound: new Audio('assets/sounds/draw_risk_cards.mp3'),
      drawGameCardSound: new Audio('assets/sounds/draw_game_cards.mp3'),
      selectGameStageSound: new Audio('assets/sounds/select_game_stage.mp3'),
      selectInsuranceStageSound: new Audio(
        'assets/sounds/select_insurance_stage.mp3'
      ),
      selectStockStageSound: new Audio('assets/sounds/select_stock_stage.mp3'),
      selectHouseStageSound: new Audio('assets/sounds/select_house_stage.mp3'),
      // 添加骰子音效
      diceRoll: new Audio('assets/sounds/dice.mp3'),
    };

    Object.values(sounds).forEach((sound) => {
      sound.load();
      sound.preload = 'auto';
    });

    return sounds;
  }

  initImageSets() {
    return {
      stock: {
        loaded: false,
        images: [],
      },
      game: {
        loaded: false,
        images: [],
      },
      house: {
        loaded: false,
        images: [],
      },
      risk: {
        loaded: false,
        images: [],
      },
    };
  }

  getEssentialImages() {
    return [
      // 头像
      ...Array.from(
        { length: 8 },
        (_, i) => `assets/images/avatar-${i + 1}.png`
      ),
      // 游戏卡片
      ...Array.from({ length: 5 }, (_, i) => `assets/images/game-${i + 1}.png`),
      // 房屋卡片
      ...Array.from(
        { length: 20 },
        (_, i) => `assets/images/house-${i + 1}.png`
      ),
      // 风险卡片
      ...Array.from(
        { length: 28 },
        (_, i) => `assets/images/risk-${i + 1}.png`
      ),
      // 股票卡片
      ...Array.from(
        { length: 36 },
        (_, i) => `assets/images/stock-${i + 1}.png`
      ),
    ];
  }

  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(src);
      img.src = src;
    });
  }

  async loadEssentialImages() {
    const essentialImages = this.getEssentialImages();
    const essentialPromises = essentialImages.map((path) =>
      this.preloadImage(path).catch((failedPath) => {
        console.error('Failed to load image:', failedPath);
      })
    );

    try {
      await Promise.all(essentialPromises);
      // console.log('Essential images loaded');
      return true;
    } catch (error) {
      console.error('Error loading essential images:', error);
      return false;
    }
  }

  getSounds() {
    return this.sounds;
  }

  getImageSets() {
    return this.imageSets;
  }
}
