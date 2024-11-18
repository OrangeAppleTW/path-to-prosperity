// src/js/diceModule.js
import { ref, onValue, update } from 'firebase/database';

const diceTemplate = `
  <div class="dice-container">
    <div class="scene">
      <div class="cube dice1">
        <div class="cube__face cube__face--1">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="8" fill="white"/>
          </svg>
        </div>
        <div class="cube__face cube__face--2">
          <svg viewBox="0 0 100 100">
            <circle cx="25" cy="25" r="8" fill="white"/>
            <circle cx="75" cy="75" r="8" fill="white"/>
          </svg>
        </div>
        <div class="cube__face cube__face--3">
          <svg viewBox="0 0 100 100">
            <circle cx="25" cy="25" r="8" fill="white"/>
            <circle cx="50" cy="50" r="8" fill="white"/>
            <circle cx="75" cy="75" r="8" fill="white"/>
          </svg>
        </div>
        <div class="cube__face cube__face--4">
          <svg viewBox="0 0 100 100">
            <circle cx="25" cy="25" r="8" fill="white"/>
            <circle cx="75" cy="25" r="8" fill="white"/>
            <circle cx="25" cy="75" r="8" fill="white"/>
            <circle cx="75" cy="75" r="8" fill="white"/>
          </svg>
        </div>
        <div class="cube__face cube__face--5">
          <svg viewBox="0 0 100 100">
            <circle cx="25" cy="25" r="8" fill="white"/>
            <circle cx="75" cy="25" r="8" fill="white"/>
            <circle cx="50" cy="50" r="8" fill="white"/>
            <circle cx="25" cy="75" r="8" fill="white"/>
            <circle cx="75" cy="75" r="8" fill="white"/>
          </svg>
        </div>
        <div class="cube__face cube__face--6">
          <svg viewBox="0 0 100 100">
            <circle cx="25" cy="25" r="8" fill="white"/>
            <circle cx="75" cy="25" r="8" fill="white"/>
            <circle cx="25" cy="50" r="8" fill="white"/>
            <circle cx="75" cy="50" r="8" fill="white"/>
            <circle cx="25" cy="75" r="8" fill="white"/>
            <circle cx="75" cy="75" r="8" fill="white"/>
          </svg>
        </div>
      </div>
    </div>
    <div class="animation-text"></div>
  </div>
`;

const diceStyles = `
  :root {
    --dice-bg-color: white;
    --dice-size: 25vh; /* 新增變數來控制骰子大小 */
    --dice-face-size: var(--dice-size);
    --dice-svg-size: 100; /* SVG viewBox 固定為100，但實際顯示大小會由CSS控制 */
    --dice-circle-radius: 8px; /* 圓點半徑 */
  }
  
  .dice-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .scene {
    width: var(--dice-size);
    height: var(--dice-size);
    margin: 0 auto;
    perspective: 400px;
    margin-bottom: 20px;
  }
  
  .cube {
    width: var(--dice-size);
    height: var(--dice-size);
    position: relative;
    transform-style: preserve-3d;
    transition: transform 1s;
  }
  
  .cube__face {
    position: absolute;
    width: var(--dice-face-size);
    height: var(--dice-face-size);
    border: 2px solid #fff;
    background: var(--dice-bg-color);
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: inset 0 0 15px rgba(0,0,0,0.2);
  }
  
  .cube__face svg {
    width: 100%;
    height: 100%;
  }
  
  /* 其餘面保持不變 */
  .cube__face--1 { transform: rotateY(0deg) translateZ(calc(var(--dice-size) / 2)); }
  .cube__face--2 { transform: rotateY(90deg) translateZ(calc(var(--dice-size) / 2)); }
  .cube__face--3 { transform: rotateY(180deg) translateZ(calc(var(--dice-size) / 2)); }
  .cube__face--4 { transform: rotateY(-90deg) translateZ(calc(var(--dice-size) / 2)); }
  .cube__face--5 { transform: rotateX(90deg) translateZ(calc(var(--dice-size) / 2)); }
  .cube__face--6 { transform: rotateX(-90deg) translateZ(calc(var(--dice-size) / 2)); }
  
  .animation-text {
    text-align: center;
    margin-top: 10px;
    font-size: 1.2em;
    color: #333;
    font-weight: bold;
  }
`;

export class DiceModule {
  constructor(options) {
    this.db = options.db;
    this.roomId = options.roomId;
    this.playerId = options.playerId;
    this.containerSelector = options.container || 'body';
    this.diceSound = new Audio('/assets/sounds/dice.mp3');
    this.diceClickNum = 0;

    // 获取容器元素
    this.container = document.querySelector(this.containerSelector);

    // 确保容器存在
    if (!this.container) {
      console.error(`容器 ${this.containerSelector} 不存在`);
      return;
    }

    // 检查是否已经存在骰子容器
    if (!this.container.querySelector('.dice-container')) {
      // 只在不存在时才插入样式和模板
      if (!document.querySelector('#dice-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'dice-styles';
        styleElement.textContent = diceStyles;
        document.head.appendChild(styleElement);
      }

      this.container.insertAdjacentHTML('beforeend', diceTemplate);
    }

    this.initializeElements();
    this.initializeDiceListener();
    this.ANIMATION_DURATION = 500;
  }

  initializeElements() {
    // 使用容器的 querySelector
    this.$diceContainer = this.container.querySelector('.dice-container');
    this.$animationText = this.container.querySelector('.animation-text');

    // 确保元素存在
    if (!this.$diceContainer || !this.$animationText) {
      console.error('无法找到必要的 DOM 元素');
      return;
    }
  }

  initializeDiceListener() {
    const playerRef = ref(
      this.db,
      `rooms/${this.roomId}/players/${this.playerId}`
    );
    onValue(playerRef, (snapshot) => {
      if (snapshot.exists()) {
        this.handleDiceStatus(snapshot.val());
      }
    });
  }

  handleDiceStatus(playerData) {
    if (!document.documentElement) return;

    // 只在狀態為 'connecting' 或 'rolled' 時設置骰子顏色
    if (
      playerData.rollStatus === 'connecting' ||
      playerData.rollStatus === 'rolled'
    ) {
      const diceColor = playerData.diceType === 1 ? '#ec706f' : '#f6c354';
      document.documentElement.style.setProperty('--dice-bg-color', diceColor);
    }

    switch (playerData.rollStatus) {
      case 'connecting':
        this.$diceContainer.style.display = 'none';
        break;

      case 'rolled':
        this.$diceContainer.style.display = 'flex';
        break;

      case 'animationPlayed':
        // 在播放動畫時使用傳入的 diceType
        this.playDiceAnimation(
          playerData.currentDiceValue,
          playerData.diceType
        ).then(() => {
          const updates = {};
          updates[
            `rooms/${this.roomId}/players/${this.playerId}/lastDiceValue`
          ] = playerData.currentDiceValue;
          updates[`rooms/${this.roomId}/players/${this.playerId}/rollStatus`] =
            'completed';
          update(ref(this.db), updates).catch((error) => {
            console.error('更新狀態失敗:', error);
          });
        });
        break;

      default:
        this.$diceContainer.style.display = 'none';
        break;
    }
  }

  async playDiceAnimation(diceValue, diceType = 1) {
    const diceColor = diceType === 1 ? '#ec706f' : '#f6c354';
    document.documentElement.style.setProperty('--dice-bg-color', diceColor);

    if (!this.$diceContainer || !this.$animationText) {
      console.error('必要的 DOM 元素不存在');
      return;
    }

    this.diceClickNum++;
    this.$diceContainer.style.display = 'flex';

    // 播放音效
    try {
      await this.diceSound.play();
    } catch (e) {
      console.log('播放音效失敗:', e);
    }

    const cube = this.container.querySelector('.dice1');
    if (!cube) {
      console.error('找不到骰子元素');
      return;
    }

    return new Promise((resolve) => {
      const cube = this.container.querySelector('.dice1');

      // 初始動畫
      cube.style.transition = `transform ${this.ANIMATION_DURATION}ms cubic-bezier(0.17, 0.67, 0.83, 0.67)`;
      cube.style.transform = `
        rotateX(${Math.random() * 1080}deg) 
        rotateY(${Math.random() * 1080}deg) 
        rotateZ(${Math.random() * 1080}deg)
      `;

      // 最終動畫
      setTimeout(() => {
        cube.style.transition = 'transform 500ms ease-out';
        cube.style.transform = this.getDiceTransform(diceValue);

        // 顯示結果
        setTimeout(() => {
          // 動畫結束後清理
          setTimeout(() => {
            if (this.playerId !== 'teacher') {
              this.$diceContainer.style.display = 'none';
            }
            cube.style.transform = 'none';
            cube.style.transition = 'transform 1s';
            resolve(); // 完成 Promise
          }, 2000);
        }, 3000);
      }, this.ANIMATION_DURATION);
    });
  }

  getDiceTransform(diceNumber) {
    const transforms = {
      1: 'rotateY(0deg)',
      2: 'rotateY(-90deg)',
      3: 'rotateY(180deg)',
      4: 'rotateY(90deg)',
      5: 'rotateX(-90deg)',
      6: 'rotateX(90deg)',
    };

    const extraRotation = 360 * this.diceClickNum;
    return `${transforms[diceNumber]} rotateZ(${extraRotation}deg)`;
  }
}
