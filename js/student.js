$(document).ready(function () {
  let baseURL;
  if (
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === 'https://fq.orangeapple.co/'
  ) {
    baseURL = window.location.origin;
  } else {
    baseURL = window.location.origin + '/path-to-prosperity';
  }

  // 預先載入 MP3 文件
  var selectGameStageSound = new Audio(
    baseURL + '/static/select_game_stage.mp3'
  );
  selectGameStageSound.load(); // 預先加載音頻

  // 預先載入 MP3 文件
  var selectInsuranceStageSound = new Audio(
    baseURL + '/static/select_insurance_stage.mp3'
  );
  selectInsuranceStageSound.load(); // 預先加載音頻

  // 預先載入 MP3 文件
  var selectStockStageSound = new Audio(
    baseURL + '/static/select_stock_stage.mp3'
  );
  selectStockStageSound.load(); // 預先加載音頻

  // 預先載入 MP3 文件
  var selectHouseStageSound = new Audio(
    baseURL + '/static/select_house_stage.mp3'
  );
  selectHouseStageSound.load(); // 預先加載音頻

  // 預先載入 MP3 文件
  var selectSaveSound = new Audio(baseURL + '/static/select_save.mp3');
  selectSaveSound.load(); // 預先加載音頻

  // 預先載入 MP3 文件
  var buyStockSound = new Audio(baseURL + '/static/buy_stock.mp3');
  buyStockSound.load(); // 預先加載音頻

  // 預先載入 MP3 文件
  var buyHouseSound = new Audio(baseURL + '/static/buy_house.mp3');
  buyHouseSound.load(); // 預先加載音頻

  // 預先載入 MP3 文件
  var sellStockSound = new Audio(baseURL + '/static/sell_stock.mp3');
  sellStockSound.load(); // 預先加載音頻

  // 預先載入 MP3 文件
  var sellHouseSound = new Audio(baseURL + '/static/sell_house.mp3');
  sellHouseSound.load(); // 預先加載音頻

  // 預先載入 MP3 文件
  var diceSound = new Audio(baseURL + '/static/dice.mp3');
  diceSound.load(); // 預先加載音頻

  var isDropdownOpen = false;
  // 獲取當前頁面的 URL
  const urlParams = new URLSearchParams(window.location.search);

  // 獲取特定的查詢參數，例如 'name'
  const name = urlParams.get('name');

  console.log(name); // 輸出查詢參數 'name' 的值

  // 隱藏內容並顯示加載中
  $('#content').hide();
  $('#loading').show();

  setTimeout(function () {
    $('#content').show();
    $('#loading').hide();
  }, 1000);

  // 遊戲回合選項列表
  var gameList = [
    '📍 第 1 回合：遊戲開始',
    '📍 第 2 回合',
    '📍 第 3 回合',
    '🔔 第 4 回合',
    '🔔 第 5 回合：發放房屋租金 🏠',
    '📍 第 6 回合：發放股票利息 📈',
    '🔔 第 7 回合',
    '📍 第 8 回合：發放儲蓄利息 🏦',
    '🔔 第 9 回合',
    '📍 第 10 回合：發放房屋租金 🏠',
    '🔔 第 11 回合',
    '📍 第 12 回合：發放股票利息 📈',
    '📍 第 13 回合',
    '🔔 第 14 回合',
    '🔔 第 15 回合：發放房屋租金 🏠',
    '📍 第 16 回合：發放儲蓄利息 🏦',
  ];

  // 儲蓄選項列表
  var saveList = [
    '儲蓄：利率 10% / 已存入 500 元 / 利息 50 元',
    '儲蓄：利率 10% / 已存入 1000 元 / 利息 100 元',
    '儲蓄：利率 10% / 已存入 1500 元 / 利息 150 元',
    '儲蓄：利率 10% / 已存入 2000 元 / 利息 200 元',
    '儲蓄：利率 10% / 已存入 2500 元 / 利息 250 元',
    '儲蓄：利率 10% / 已存入 3000 元 / 利息 300 元',
    '儲蓄：利率 10% / 已存入 3500 元 / 利息 350 元',
    '儲蓄：利率 10% / 已存入 4000 元 / 利息 400 元',
    '儲蓄：利率 10% / 已存入 4500 元 / 利息 450 元',
    '儲蓄：利率 10% / 已存入 5000 元 / 利息 500 元',
    '儲蓄：利率 10% / 已存入 5500 元 / 利息 550 元',
    '儲蓄：利率 10% / 已存入 6000 元 / 利息 600 元',
    '儲蓄：利率 10% / 已存入 6500 元 / 利息 650 元',
    '儲蓄：利率 10% / 已存入 7000 元 / 利息 700 元',
    '儲蓄：利率 10% / 已存入 7500 元 / 利息 750 元',
    '儲蓄：利率 10% / 已存入 8000 元 / 利息 800 元',
    '儲蓄：利率 10% / 已存入 8500 元 / 利息 850 元',
    '儲蓄：利率 10% / 已存入 9000 元 / 利息 900 元',
    '儲蓄：利率 10% / 已存入 9500 元 / 利息 950 元',
    '儲蓄：利率 10% / 已存入 10000 元 / 利息 1000 元',
    '儲蓄：利率 10% / 已存入 10500 元 / 利息 1050 元',
    '儲蓄：利率 10% / 已存入 11000 元 / 利息 1100 元',
    '儲蓄：利率 10% / 已存入 11500 元 / 利息 1150 元',
    '儲蓄：利率 10% / 已存入 12000 元 / 利息 1200 元',
    '儲蓄：利率 10% / 已存入 12500 元 / 利息 1250 元',
    '儲蓄：利率 10% / 已存入 13000 元 / 利息 1300 元',
    '儲蓄：利率 10% / 已存入 13500 元 / 利息 1350 元',
    '儲蓄：利率 10% / 已存入 14000 元 / 利息 1400 元',
    '儲蓄：利率 10% / 已存入 14500 元 / 利息 1450 元',
    '儲蓄：利率 10% / 已存入 15000 元 / 利息 1500 元',
    '儲蓄：利率 10% / 已存入 15500 元 / 利息 1550 元',
    '儲蓄：利率 10% / 已存入 16000 元 / 利息 1600 元',
    '儲蓄：利率 10% / 已存入 16500 元 / 利息 1650 元',
    '儲蓄：利率 10% / 已存入 17000 元 / 利息 1700 元',
    '儲蓄：利率 10% / 已存入 17500 元 / 利息 1750 元',
    '儲蓄：利率 10% / 已存入 18000 元 / 利息 1800 元',
    '儲蓄：利率 10% / 已存入 18500 元 / 利息 1850 元',
    '儲蓄：利率 10% / 已存入 19000 元 / 利息 1900 元',
    '儲蓄：利率 10% / 已存入 19500 元 / 利息 1950 元',
    '儲蓄：利率 10% / 已存入 20000 元 / 利息 2000 元',
    '儲蓄：利率 10% / 已存入 20500 元 / 利息 2050 元',
    '儲蓄：利率 10% / 已存入 21000 元 / 利息 2100 元',
    '儲蓄：利率 10% / 已存入 21500 元 / 利息 2150 元',
    '儲蓄：利率 10% / 已存入 22000 元 / 利息 2200 元',
    '儲蓄：利率 10% / 已存入 22500 元 / 利息 2250 元',
    '儲蓄：利率 10% / 已存入 23000 元 / 利息 2300 元',
    '儲蓄：利率 10% / 已存入 23500 元 / 利息 2350 元',
    '儲蓄：利率 10% / 已存入 24000 元 / 利息 2400 元',
    '儲蓄：利率 10% / 已存入 24500 元 / 利息 2450 元',
    '儲蓄：利率 10% / 已存入 25000 元 / 利息 2500 元',
    '儲蓄：利率 10% / 已存入 25500 元 / 利息 2550 元',
    '儲蓄：利率 10% / 已存入 26000 元 / 利息 2600 元',
    '儲蓄：利率 10% / 已存入 26500 元 / 利息 2650 元',
    '儲蓄：利率 10% / 已存入 27000 元 / 利息 2700 元',
    '儲蓄：利率 10% / 已存入 27500 元 / 利息 2750 元',
    '儲蓄：利率 10% / 已存入 28000 元 / 利息 2800 元',
    '儲蓄：利率 10% / 已存入 28500 元 / 利息 2850 元',
    '儲蓄：利率 10% / 已存入 29000 元 / 利息 2900 元',
    '儲蓄：利率 10% / 已存入 29500 元 / 利息 2950 元',
    '儲蓄：利率 10% / 已存入 30000 元 / 利息 3000 元',
  ];

  // 保險選項列表
  var insuranceList = [
    '保險：目前有 1 張保險卡',
    '保險：目前有 2 張保險卡',
    '保險：目前有 3 張保險卡',
    '保險：目前有 4 張保險卡',
    '保險：目前有 5 張保險卡',
    '保險：目前有 6 張保險卡',
    '保險：目前有 7 張保險卡',
    '保險：目前有 8 張保險卡',
    '保險：目前有 9 張保險卡',
    '保險：目前有 10 張保險卡',
  ];

  // 股票和房屋階段列表
  var stockRounds = [
    '股票：第 5 階段 / 價格 +1000  / 股利 +250',
    '股票：第 4 階段 / 價格 +800  / 股利 +200',
    '股票：第 3 階段 / 價格 +600  / 股利 +150',
    '股票：第 2 階段 / 價格 +400  / 股利 +100',
    '股票：第 1 階段 / 價格 +200  / 股利 +50',
    '股票：第 0 階段 / 價格 +0  / 股利 +0',
    '股票：第 -1 階段 / 價格 -200  / 股利 -50',
    '股票：第 -2 階段 / 價格 -400  / 股利 -100',
    '股票：第 -3 階段 / 價格 -600  / 股利 -150',
    '股票：第 -4 階段 / 價格 -800  / 股利 -200',
    '股票：第 -5 階段 / 價格 -1000  / 股利 -250',
  ];

  var houseRounds = [
    '房屋：第 5 階段 / 價格 +1000',
    '房屋：第 4 階段 / 價格 +800',
    '房屋：第 3 階段 / 價格 +600',
    '房屋：第 2 階段 / 價格 +400',
    '房屋：第 1 階段 / 價格 +200',
    '房屋：第 0 階段 / 價格 +0',
    '房屋：第 -1 階段 / 價格 -200',
    '房屋：第 -2 階段 / 價格 -400',
    '房屋：第 -3 階段 / 價格 -600',
    '房屋：第 -4 階段 / 價格 -800',
    '房屋：第 -5 階段 / 價格 -1000',
  ];

  // 股票和房屋數據
  var stocksData = [
    {
      id: 'S1',
      name: '船運業',
      buyPrice: 1000,
      sellPrice: 1000,
      dividend: 100,
    },
    {
      id: 'S2',
      name: '能源企業',
      buyPrice: 1000,
      sellPrice: 1000,
      dividend: 150,
    },
    {
      id: 'S3',
      name: '銀行業',
      buyPrice: 1100,
      sellPrice: 1100,
      dividend: 150,
    },
    {
      id: 'S4',
      name: '製藥公司',
      buyPrice: 1200,
      sellPrice: 1200,
      dividend: 100,
    },
    {
      id: 'S5',
      name: '航空公司',
      buyPrice: 1300,
      sellPrice: 1300,
      dividend: 150,
    },
    {
      id: 'S6',
      name: '金礦業',
      buyPrice: 1300,
      sellPrice: 1300,
      dividend: 200,
    },
    {
      id: 'S7',
      name: '食品加工業',
      buyPrice: 1100,
      sellPrice: 1100,
      dividend: 150,
    },
    {
      id: 'S8',
      name: '汽車製造商',
      buyPrice: 1500,
      sellPrice: 1500,
      dividend: 150,
    },
    {
      id: 'S9',
      name: '消費品巨頭',
      buyPrice: 1500,
      sellPrice: 1500,
      dividend: 200,
    },
    {
      id: 'S10',
      name: '教育科技',
      buyPrice: 1600,
      sellPrice: 1600,
      dividend: 200,
    },
    {
      id: 'S11',
      name: '醫療科技',
      buyPrice: 1700,
      sellPrice: 1700,
      dividend: 250,
    },
    {
      id: 'S12',
      name: '科技巨頭',
      buyPrice: 1700,
      sellPrice: 1700,
      dividend: 250,
    },
    {
      id: 'S13',
      name: '綠色能源',
      buyPrice: 1800,
      sellPrice: 1800,
      dividend: 150,
    },
    {
      id: 'S14',
      name: '娛樂產業',
      buyPrice: 1800,
      sellPrice: 1800,
      dividend: 250,
    },
    {
      id: 'S15',
      name: '太陽能科技',
      buyPrice: 1800,
      sellPrice: 1800,
      dividend: 200,
    },
    {
      id: 'S16',
      name: '網際網路',
      buyPrice: 1900,
      sellPrice: 1900,
      dividend: 250,
    },
    {
      id: 'S17',
      name: '石油開採',
      buyPrice: 1900,
      sellPrice: 1900,
      dividend: 250,
    },
    {
      id: 'S18',
      name: '人工智慧',
      buyPrice: 2000,
      sellPrice: 2000,
      dividend: 300,
    },
    {
      id: 'S19',
      name: '電子科技',
      buyPrice: 1100,
      sellPrice: 1100,
      dividend: 150,
    },
    {
      id: 'S20',
      name: '物流管理',
      buyPrice: 1100,
      sellPrice: 1100,
      dividend: 200,
    },
    {
      id: 'S21',
      name: '水資源管理',
      buyPrice: 1200,
      sellPrice: 1200,
      dividend: 150,
    },
    {
      id: 'S22',
      name: '新興市場',
      buyPrice: 2000,
      sellPrice: 2000,
      dividend: 200,
    },
    {
      id: 'S23',
      name: '生物科技',
      buyPrice: 1200,
      sellPrice: 1200,
      dividend: 150,
    },
    {
      id: 'S24',
      name: '電動車製造',
      buyPrice: 1400,
      sellPrice: 1400,
      dividend: 150,
    },
    {
      id: 'S25',
      name: '金融科技',
      buyPrice: 1400,
      sellPrice: 1400,
      dividend: 300,
    },
    {
      id: 'S26',
      name: '生態旅遊',
      buyPrice: 1500,
      sellPrice: 1500,
      dividend: 100,
    },
    {
      id: 'S27',
      name: '健康產業',
      buyPrice: 1600,
      sellPrice: 1600,
      dividend: 200,
    },
    {
      id: 'S28',
      name: '綠色建築',
      buyPrice: 1600,
      sellPrice: 1600,
      dividend: 250,
    },
    {
      id: 'S29',
      name: '資訊安全',
      buyPrice: 1700,
      sellPrice: 1700,
      dividend: 300,
    },
    {
      id: 'S30',
      name: '食品科技',
      buyPrice: 1700,
      sellPrice: 1700,
      dividend: 200,
    },
    {
      id: 'S31',
      name: '地球科學',
      buyPrice: 1800,
      sellPrice: 1800,
      dividend: 200,
    },
    {
      id: 'S32',
      name: '文化創意產業',
      buyPrice: 1800,
      sellPrice: 1800,
      dividend: 250,
    },
    {
      id: 'S33',
      name: '海洋科技',
      buyPrice: 1900,
      sellPrice: 1900,
      dividend: 300,
    },
    {
      id: 'S34',
      name: '空氣品質科技',
      buyPrice: 1900,
      sellPrice: 1900,
      dividend: 250,
    },
    {
      id: 'S35',
      name: '電子商務',
      buyPrice: 2000,
      sellPrice: 2000,
      dividend: 300,
    },
    {
      id: 'S36',
      name: '環保科技',
      buyPrice: 2000,
      sellPrice: 2000,
      dividend: 400,
    },
  ];

  var housesData = [
    {
      id: 'H1',
      name: '村莊小屋',
      buyPrice: 3500,
      sellPrice: 3500,
      rent: 400,
    },
    {
      id: 'H2',
      name: '山區度假屋',
      buyPrice: 3600,
      sellPrice: 3600,
      rent: 300,
    },
    {
      id: 'H3',
      name: '河畔房屋',
      buyPrice: 3700,
      sellPrice: 3700,
      rent: 250,
    },
    {
      id: 'H4',
      name: '湖畔房屋',
      buyPrice: 3800,
      sellPrice: 3800,
      rent: 350,
    },
    {
      id: 'H5',
      name: '度假山屋',
      buyPrice: 3900,
      sellPrice: 3900,
      rent: 350,
    },
    {
      id: 'H6',
      name: '市中心公寓',
      buyPrice: 4000,
      sellPrice: 4000,
      rent: 400,
    },
    {
      id: 'H7',
      name: '湖景公寓',
      buyPrice: 4100,
      sellPrice: 4100,
      rent: 400,
    },
    {
      id: 'H8',
      name: '城市公寓',
      buyPrice: 4200,
      sellPrice: 4200,
      rent: 350,
    },
    {
      id: 'H9',
      name: '郊區別墅',
      buyPrice: 4300,
      sellPrice: 4300,
      rent: 450,
    },
    {
      id: 'H10',
      name: '現代都市套房',
      buyPrice: 4300,
      sellPrice: 4300,
      rent: 450,
    },
    {
      id: 'H11',
      name: '高級公寓',
      buyPrice: 4400,
      sellPrice: 4400,
      rent: 500,
    },
    {
      id: 'H12',
      name: '海濱別墅',
      buyPrice: 4500,
      sellPrice: 4500,
      rent: 400,
    },
    {
      id: 'H13',
      name: '高級套房',
      buyPrice: 4600,
      sellPrice: 4600,
      rent: 450,
    },
    {
      id: 'H14',
      name: '山坡別墅',
      buyPrice: 4600,
      sellPrice: 4600,
      rent: 500,
    },
    {
      id: 'H15',
      name: '度假別墅',
      buyPrice: 4700,
      sellPrice: 4700,
      rent: 450,
    },
    {
      id: 'H16',
      name: '景觀公寓',
      buyPrice: 4800,
      sellPrice: 4800,
      rent: 600,
    },
    {
      id: 'H17',
      name: '古老莊園',
      buyPrice: 4900,
      sellPrice: 4900,
      rent: 550,
    },
    {
      id: 'H18',
      name: '別墅區豪宅',
      buyPrice: 5000,
      sellPrice: 5000,
      rent: 550,
    },
    {
      id: 'H19',
      name: '河畔豪宅',
      buyPrice: 5100,
      sellPrice: 5100,
      rent: 650,
    },
    {
      id: 'H20',
      name: '海灘別墅',
      buyPrice: 5200,
      sellPrice: 5200,
      rent: 600,
    },
  ];

  var selectedStocks = [];
  var selectedHouses = [];
  var sellingRecords = [];

  // 變量用於儲存要刪除的索引
  let stockIdxToDelete = null;
  let houseIdxToDelete = null;

  // 初始化選擇元素
  var selectGame = $('#game-select');
  var selectSave = $('#save-select');
  var selectInsurance = $('#insurance-select');
  var selectStockRound = $('#stock-round-select');
  var selectHouseRound = $('#house-round-select');
  var selectStock = $('#stock-select');
  var selectHouse = $('#house-select');

  // 填充儲蓄選項
  // 添加預設選項
  selectGame.append(
    $('<option>', {
      value: '0',
      text: '選擇遊戲回合',
    })
  );
  $.each(gameList, function (index, round) {
    selectGame.append(
      $('<option>', {
        value: index + 1,
        text: round,
      })
    );
  });

  // 播放音效
  selectGame.on('mousedown', function () {
    selectGameStageSound.currentTime = 0;
    isDropdownOpen = true;
  });

  selectGame.on('change', function () {
    if (isDropdownOpen) {
      selectGameStageSound.play();
      isDropdownOpen = false;
    }
  });

  // 恢復選擇的儲蓄階段
  var savedGameRound = localStorage.getItem('saveGame');
  if (savedGameRound) {
    selectGame.val(savedGameRound);
  } else {
    selectGame.val('0'); // 預設值
  }

  // 監聽儲蓄階段的變更並儲存到 localStorage
  selectGame.change(function () {
    localStorage.setItem('saveGame', $(this).val());
  });

  // 填充儲蓄選項
  // 添加預設選項
  selectSave.append(
    $('<option>', {
      value: '0',
      text: '儲蓄：利率 10% / 已存入 0 元 / 利息 0 元',
    })
  );
  $.each(saveList, function (index, round) {
    selectSave.append(
      $('<option>', {
        value: index + 1,
        text: round,
      })
    );
  });

  // 恢復選擇的儲蓄階段
  var savedSaveRound = localStorage.getItem('saveRound');
  if (savedSaveRound) {
    selectSave.val(savedSaveRound);
  } else {
    selectSave.val('0'); // 預設值
  }

  // 監聽儲蓄階段的變更並儲存到 localStorage
  selectSave.change(function () {
    localStorage.setItem('saveRound', $(this).val());
    updateAssetsExcludingCash();
  });

  // 播放音效
  selectSave.on('mousedown', function () {
    selectSaveSound.currentTime = 0;
    isDropdownOpen = true;
  });

  selectSave.on('change', function () {
    if (isDropdownOpen) {
      selectSaveSound.play();
      isDropdownOpen = false;
    }
  });

  // 填充保險選項
  // 添加預設選項
  selectInsurance.append(
    $('<option>', {
      value: '0',
      text: '保險：目前有 0 張保險卡',
    })
  );
  $.each(insuranceList, function (index, round) {
    selectInsurance.append(
      $('<option>', {
        value: index + 1,
        text: round,
      })
    );
  });

  // 恢復選擇的保險階段
  var savedInsuranceRound = localStorage.getItem('insuranceRound');
  if (savedInsuranceRound) {
    selectInsurance.val(savedInsuranceRound);
  } else {
    selectInsurance.val('0'); // 預設值
  }

  // 監聽保險階段的變更並儲存到 localStorage
  selectInsurance.change(function () {
    localStorage.setItem('insuranceRound', $(this).val());
  });

  // 播放音效
  selectInsurance.on('mousedown', function () {
    selectInsuranceStageSound.currentTime = 0;
    isDropdownOpen = true;
  });

  selectInsurance.on('change', function () {
    if (isDropdownOpen) {
      selectInsuranceStageSound.play();
      isDropdownOpen = false;
    }
  });

  // 填充股票階段選項
  // 添加預設選項
  selectStockRound.append(
    $('<option>', {
      value: '0',
      text: '選擇股票階段',
    })
  );
  $.each(stockRounds, function (index, round) {
    selectStockRound.append(
      $('<option>', {
        value: index + 1,
        text: round,
      })
    );
  });

  // 恢復選擇的股票階段
  var savedStockRound = localStorage.getItem('stockRound');
  if (savedStockRound) {
    selectStockRound.val(savedStockRound);
  } else {
    selectStockRound.val('6'); // 預設值
  }

  // 監聽股票階段的變更並更新股票價格
  selectStockRound.change(function () {
    localStorage.setItem('stockRound', $(this).val());
    updateStockSellPrices();
    updateStockList();
    saveStockList();
    updateTotalDividends();
    updateAssetsExcludingCash();
  });

  // 播放音效
  selectStockRound.on('mousedown', function () {
    selectStockStageSound.currentTime = 0;
    isDropdownOpen = true;
  });

  selectStockRound.on('change', function () {
    if (isDropdownOpen) {
      selectStockStageSound.play();
      isDropdownOpen = false;
    }
  });

  // 填充房屋階段選項
  // 添加預設選項
  selectHouseRound.append(
    $('<option>', {
      value: '0',
      text: '選擇房屋階段',
    })
  );
  $.each(houseRounds, function (index, round) {
    selectHouseRound.append(
      $('<option>', {
        value: index + 1,
        text: round,
      })
    );
  });

  // 恢復選擇的房屋階段
  var savedHouseRound = localStorage.getItem('houseRound');
  if (savedHouseRound) {
    selectHouseRound.val(savedHouseRound);
  } else {
    selectHouseRound.val('6'); // 預設值
  }

  // 監聽房屋階段的變更並更新房屋價格
  selectHouseRound.change(function () {
    localStorage.setItem('houseRound', $(this).val());
    updateHouseSellPrices();
    updateHouseList();
    saveHouseList();
    updateTotalRent();
    updateAssetsExcludingCash();
  });

  // 播放音效
  selectHouseRound.on('mousedown', function () {
    selectHouseStageSound.currentTime = 0;
    isDropdownOpen = true;
  });

  selectHouseRound.on('change', function () {
    if (isDropdownOpen) {
      selectHouseStageSound.play();
      isDropdownOpen = false;
    }
  });

  // 填充股票選項
  // 添加預設選項
  selectStock.append(
    $('<option>', {
      value: '0',
      text: '選擇要購買的股票',
    })
  );
  $.each(stocksData, function (index, stock) {
    var optionText = stock.id + ' ' + stock.name;
    selectStock.append(
      $('<option>', {
        value: index + 1,
        text: optionText,
      })
    );
  });

  // 監聽股票選擇
  selectStock.change(function () {
    $('#add-stock').prop('disabled', false);
  });

  // 填充房屋選項
  // 添加預設選項
  selectHouse.append(
    $('<option>', {
      value: '0',
      text: '選擇要購買的房屋',
    })
  );
  $.each(housesData, function (index, house) {
    var optionText = house.id + ' ' + house.name;
    selectHouse.append(
      $('<option>', {
        value: index + 1,
        text: optionText,
      })
    );
  });

  // 監聽房屋選擇
  selectHouse.change(function () {
    $('#add-house').prop('disabled', false);
  });

  // 加載已保存的列表
  loadLists();

  // 添加股票的事件處理程序
  $('#add-stock').click(function () {
    var selectedTask = $('#stock-select').val();
    if (selectedTask && selectedTask !== '0') {
      var stock = stocksData[selectedTask - 1];
      selectedStocks.push({
        ...stock,
      }); // 深拷貝股票對象
      updateStockSellPrices();
      updateStockList();
      saveStockList();
      updateTotalDividends();
      updateAssetsExcludingCash();
      buyStockSound.currentTime = 0;
      buyStockSound.play();
    } else {
      alert('請選擇要新增的股票！');
    }
    $('#stock-select').val('0'); // 重置為預設值
  });

  // 添加房屋的事件處理程序
  $('#add-house').click(function () {
    var selectedHouse = $('#house-select').val();
    if (selectedHouse && selectedHouse !== '0') {
      var house = housesData[selectedHouse - 1];
      selectedHouses.push({
        ...house,
      }); // 深拷貝房屋對象
      updateHouseSellPrices();
      updateHouseList();
      saveHouseList();
      updateTotalRent();
      updateAssetsExcludingCash();
      buyHouseSound.currentTime = 0;
      buyHouseSound.play();
    } else {
      alert('請選擇要新增的房屋！');
    }
    $('#house-select').val('0'); // 重置為預設值
  });

  // 刪除股票的事件處理程序
  $('#stocklist').on('click', '.delete-task', function () {
    stockIdxToDelete = $(this).data('index');
    var stock = selectedStocks[stockIdxToDelete];
    var selectedValue = selectStockRound.val();
    var now_stockRound_info = stockRounds[selectedValue - 1];
    var priceMatch = now_stockRound_info.match(/價格 ([+-]?\d+)/);
    var stageMatch = now_stockRound_info.match(/第\s*(-?\d+)\s*階段/);
    var price = priceMatch ? priceMatch[1] : '0';
    var stage = stageMatch ? stageMatch[1] : '未知';
    $('#info1').text(`目前是第 ${stage} 階段`);
    $('#info2').text(`買入的價格是 ${stock.buyPrice} 元`);
    $('#info3').text(`漲跌幅是 ${price} 元`);
    $('#info4').text(`賣出的價格是 ${stock.buyPrice + Number(price)} 元`);
    $('#info5').text(`請確認是否要賣出 ${stock.id} ${stock.name}？`);
    $('#deleteConfirmModal').modal('show'); // 顯示確認模態框
  });

  // 刪除房屋的事件處理程序
  $('#houselist').on('click', '.delete-task', function () {
    houseIdxToDelete = $(this).data('index');
    var house = selectedHouses[houseIdxToDelete];
    var selectedValue = selectHouseRound.val();
    var now_houseRound_info = houseRounds[selectedValue - 1];
    var priceMatch = now_houseRound_info.match(/價格 ([+-]?\d+)/);
    var stageMatch = now_houseRound_info.match(/第\s*(-?\d+)\s*階段/);
    var price = priceMatch ? priceMatch[1] : '0';
    var stage = stageMatch ? stageMatch[1] : '未知';
    $('#info1').text(`目前是第 ${stage} 階段`);
    $('#info2').text(`買入的價格是 ${house.buyPrice} 元`);
    $('#info3').text(`漲跌幅是 ${price} 元`);
    $('#info4').text(`賣出的價格是 ${house.buyPrice + Number(price)} 元`);
    $('#info5').text(`請確認是否要賣出 ${house.id} ${house.name}？`);
    $('#deleteConfirmModal').modal('show'); // 顯示確認模態框
  });

  // 確認刪除的事件處理程序
  $('#confirm-delete').click(function () {
    if (houseIdxToDelete != null) {
      var house = selectedHouses[houseIdxToDelete];
      sellingRecords.push({
        ...house,
      }); // 深拷貝房屋對象
      updateSellList();
      saveSellList();
      selectedHouses.splice(houseIdxToDelete, 1);
      updateHouseList();
      saveHouseList();
      houseIdxToDelete = null;
      updateTotalRent();
      updateAssetsExcludingCash();
      sellHouseSound.currentTime = 0;
      sellHouseSound.play();
    }
    if (stockIdxToDelete != null) {
      var stock = selectedStocks[stockIdxToDelete];
      sellingRecords.push({
        ...stock,
      }); // 深拷貝房屋對象
      updateSellList();
      saveSellList();
      selectedStocks.splice(stockIdxToDelete, 1);
      updateStockList();
      saveStockList();
      stockIdxToDelete = null;
      updateTotalDividends();
      updateAssetsExcludingCash();
      sellStockSound.currentTime = 0;
      sellStockSound.play();
    }
    $('#deleteConfirmModal').modal('hide'); // 隱藏確認模態框
  });

  // 資產骰子

  $('#assets-dice').click(function () {
    $('#assetsDiceModal').modal('show');
  });

  var dice1ClickNum = 0;
  var $elDiceOne = $('#dice1');
  var lastDiceOne = 0;

  $elDiceOne.on('click', function () {
    diceSound.currentTime = 0;
    diceSound.play();
    rollDiceOne();
  });

  function rollDiceOne() {
    dice1ClickNum++;

    var diceOne = Math.floor(Math.random() * 6) + 1;

    if (diceOne == 1) {
      $elDiceOne.css({
        transform: `rotateX(${360 * dice1ClickNum + 720}deg) rotateY(${
          720 * dice1ClickNum + 0
        }deg) rotateZ(-${360 * dice1ClickNum + 720}deg)`,
      });
    }

    if (diceOne == 2) {
      $elDiceOne.css({
        transform: `rotateX(-${360 * dice1ClickNum + 900}deg) rotateY(${
          720 * dice1ClickNum + 0
        }deg) rotateZ(${360 * dice1ClickNum + 1080}deg)`,
      });
    }

    if (diceOne == 3) {
      $elDiceOne.css({
        transform: `rotateX(${720 * dice1ClickNum + 0}deg) rotateY(${
          360 * dice1ClickNum + 810
        }deg) rotateZ(${360 * dice1ClickNum + 720}deg)`,
      });
    }

    if (diceOne == 4) {
      $elDiceOne.css({
        transform: `rotateX(-${360 * dice1ClickNum + 810}deg) rotateY(${
          720 * dice1ClickNum + 0
        }deg) rotateZ(-${360 * dice1ClickNum + 1080}deg)`,
      });
    }

    if (diceOne == 5) {
      $elDiceOne.css({
        transform: `rotateX(${360 * dice1ClickNum + 450}deg) rotateY(${
          720 * dice1ClickNum + 0
        }deg) rotateZ(-${360 * dice1ClickNum + 720}deg)`,
      });
    }

    if (diceOne == 6) {
      $elDiceOne.css({
        transform: `rotateX(${720 * dice1ClickNum + 0}deg) rotateY(-${
          360 * dice1ClickNum + 450
        }deg) rotateZ(-${360 * dice1ClickNum + 1440}deg)`,
      });
    }
  }

  // 風險骰子
  $('#risk-dice').click(function () {
    $('#riskDiceModal').modal('show');
  });

  var dice2ClickNum = 0;
  var $elDiceTwo = $('#dice2');
  var lastDiceTwo = 0;

  $elDiceTwo.on('click', function () {
    diceSound.currentTime = 0;
    diceSound.play();
    rollDiceTwo();
  });

  function rollDiceTwo() {
    dice2ClickNum++;

    var diceTwo = Math.floor(Math.random() * 6) + 1;

    if (diceTwo == 1) {
      $elDiceTwo.css({
        transform: `rotateX(${360 * dice2ClickNum + 720}deg) rotateY(${
          720 * dice2ClickNum + 0
        }deg) rotateZ(-${360 * dice2ClickNum + 720}deg)`,
      });
    }

    if (diceTwo == 2) {
      $elDiceTwo.css({
        transform: `rotateX(-${360 * dice2ClickNum + 900}deg) rotateY(${
          720 * dice2ClickNum + 0
        }deg) rotateZ(${360 * dice2ClickNum + 1080}deg)`,
      });
    }

    if (diceTwo == 3) {
      $elDiceTwo.css({
        transform: `rotateX(${720 * dice2ClickNum + 0}deg) rotateY(${
          360 * dice2ClickNum + 810
        }deg) rotateZ(${360 * dice2ClickNum + 720}deg)`,
      });
    }

    if (diceTwo == 4) {
      $elDiceTwo.css({
        transform: `rotateX(-${360 * dice2ClickNum + 810}deg) rotateY(${
          720 * dice2ClickNum + 0
        }deg) rotateZ(-${360 * dice2ClickNum + 1080}deg)`,
      });
    }

    if (diceTwo == 5) {
      $elDiceTwo.css({
        transform: `rotateX(${360 * dice2ClickNum + 450}deg) rotateY(${
          720 * dice2ClickNum + 0
        }deg) rotateZ(-${360 * dice2ClickNum + 720}deg)`,
      });
    }

    if (diceTwo == 6) {
      $elDiceTwo.css({
        transform: `rotateX(${720 * dice2ClickNum + 0}deg) rotateY(-${
          360 * dice2ClickNum + 450
        }deg) rotateZ(-${360 * dice2ClickNum + 1440}deg)`,
      });
    }
  }

  // 重新一局功能

  $('#reset-game').click(function () {
    $('#resetConfirmModal').modal('show');
    var countdown = 3;
    var confirmButton = $('#confirm-reset');
    confirmButton.prop('disabled', true);
    confirmButton.text('確認（' + countdown + '）');
    var timer = setInterval(function () {
      countdown--;
      confirmButton.text('確認（' + countdown + '）');
      if (countdown <= 0) {
        clearInterval(timer);
        confirmButton.prop('disabled', false);
        confirmButton.text('確認');
      }
    }, 1000);
  });

  $('#confirm-reset').click(function () {
    localStorage.clear();
    location.reload();
  });

  // 賣出紀錄功能

  $('#selling-record').click(function () {
    $('#sellingRecordModal').modal('show');
  });

  // 更新股票列表的函數
  function updateStockList() {
    $('#stocklist').html(''); // 清空現有列表
    $.each(selectedStocks, function (index, stock) {
      var profit = stock.sellPrice - stock.buyPrice;
      var profitText = profit < 0 ? '-' + Math.abs(profit) : '+' + profit;
      var btnClass =
        profit < 0 ? 'bg-danger text-light' : 'bg-success text-light';
      var taskCard = `
            <div class="col-md-6 mb-3">
            <div class="card stock-card">
            <div class="card-body">
            <h5 class="card-title">${stock.id} - ${stock.name}</h5>
            <div class="card mb-2">
            <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between">
            買入：${stock.buyPrice}
            </li>
            <li class="list-group-item">賣出：${stock.sellPrice}</li>
            <li class="list-group-item">股利：${stock.dividend}</li>
            </ul>
            </div>
            <button class="btn ${btnClass} btn-sm delete-task w-100" data-index="${index}">
            ${profitText} 賣出
            </button>
            </div>
            </div>
            </div>`;
      $('#stocklist').prepend(taskCard);
    });
    saveStockList(); // 保存到 localStorage
    updateTotalDividends();
    updateAssetsExcludingCash();
  }

  // 更新房屋列表的函數
  function updateHouseList() {
    $('#houselist').html(''); // 清空現有列表
    $.each(selectedHouses, function (index, house) {
      var profit = house.sellPrice - house.buyPrice;
      var profitText = profit < 0 ? '-' + Math.abs(profit) : '+' + profit;
      var btnClass =
        profit < 0 ? 'bg-danger text-light' : 'bg-success text-light';
      var taskCard = `
            <div class="col-md-6 mb-3">
            <div class="card house-card">
            <div class="card-body">
            <h5 class="card-title">${house.id} - ${house.name}</h5>
            <div class="card mb-2">
            <ul class="list-group list-group-flush">
            <li class="list-group-item d-flex justify-content-between">
            買入：${house.buyPrice}
            </li>
            <li class="list-group-item">賣出：${house.sellPrice}</li>
            <li class="list-group-item">租金：${house.rent}</li>
            </ul>
            </div>
            <button class="btn ${btnClass} btn-sm delete-task w-100" data-index="${index}">
            ${profitText} 賣出
            </button>
            </div>
            </div>
            </div>`;
      $('#houselist').prepend(taskCard);
    });
    saveHouseList(); // 保存到 localStorage
    updateTotalRent();
    updateAssetsExcludingCash();
  }

  // 更新賣出列表的函數
  function updateSellList() {
    $('#selllist').html(''); // 清空現有列表
    $.each(sellingRecords, function (index, record) {
      console.log(record);
      var taskCard = `
            <tr>
                <td class="fw-bold ${
                  record.id.includes('S') ? 'text-info' : 'text-warning'
                }">${record.id.includes('S') ? '股票' : '房屋'}</td>
                <td>${record.id}</td>
                <td>${record.name}</td>
                <td>${record.sellPrice}</td>
            </tr>
            `;
      $('#selllist').prepend(taskCard);
    });
    saveHouseList(); // 保存到 localStorage
  }

  // 保存股票列表到 localStorage
  function saveStockList() {
    localStorage.setItem('stocklist', JSON.stringify(selectedStocks));
  }

  // 保存房屋列表到 localStorage
  function saveHouseList() {
    localStorage.setItem('houselist', JSON.stringify(selectedHouses));
  }

  // 保存賣出列表到 localStorage
  function saveSellList() {
    localStorage.setItem('selllist', JSON.stringify(sellingRecords));
  }

  // 加載已保存的列表
  function loadLists() {
    var savedStockList = JSON.parse(localStorage.getItem('stocklist'));
    if (savedStockList) {
      selectedStocks = savedStockList;
      updateStockSellPrices();
      updateStockList();
      updateTotalDividends();
      updateAssetsExcludingCash();
    }

    var savedHouseList = JSON.parse(localStorage.getItem('houselist'));
    if (savedHouseList) {
      selectedHouses = savedHouseList;
      updateHouseSellPrices();
      updateHouseList();
      updateTotalRent();
      updateAssetsExcludingCash();
    }

    var savedSellList = JSON.parse(localStorage.getItem('selllist'));
    if (savedSellList) {
      sellingRecords = savedSellList;
      updateSellList();
    }
  }

  // 更新總股利
  function updateTotalDividends() {
    var totalDividends = 0;
    var selectedValue = selectStockRound.val();
    var now_stockRound_info = stockRounds[selectedValue - 1];
    var dividendMatch = now_stockRound_info.match(/股利 ([+-]?\d+)/);
    var dividendChange = dividendMatch ? Number(dividendMatch[1]) : 0;
    selectedStocks.forEach(function (stock) {
      var stockDividend = stock.dividend + dividendChange;
      totalDividends += stockDividend;
    });
    var dividendInput = $('span:contains("這個階段的所有股利")').next('input');
    dividendInput.val(totalDividends);
  }

  // 更新總租金
  function updateTotalRent() {
    var totalRent = 0;
    selectedHouses.forEach(function (house) {
      totalRent += house.rent;
    });
    var rentInput = $('span:contains("這個階段的所有房租")').next('input');
    rentInput.val(totalRent);
  }

  // 更新現金以外的資產
  function updateAssetsExcludingCash() {
    var totalAssets = 0;
    selectedStocks.forEach(function (stock) {
      totalAssets += stock.sellPrice;
    });
    selectedHouses.forEach(function (house) {
      totalAssets += house.sellPrice;
    });
    var selectedSaveOption = selectSave.find('option:selected').text();
    var savedAmountMatch = selectedSaveOption.match(/已存入 (\d+) 元/);
    var savedAmount = savedAmountMatch ? Number(savedAmountMatch[1]) : 0;
    totalAssets += savedAmount;
    var assetsInput = $('span:contains("現金以外的資產")').next('input');
    assetsInput.val(totalAssets);
    updateTotalAssets();
  }

  // 更新總資產
  function updateTotalAssets() {
    var cashInput = $('span:contains("輸入手上的現金")').next('input');
    var cashAmount = Number(cashInput.val()) || 0;
    var assetsInput = $('span:contains("現金以外的資產")').next('input');
    var assetsAmount = Number(assetsInput.val()) || 0;
    var totalAssets = cashAmount + assetsAmount;
    var totalAssetsInput = $('span:contains("加總所有的資產")').next('input');
    totalAssetsInput.val(totalAssets);
  }

  // 更新股票的賣出價格
  function updateStockSellPrices() {
    var selectedValue = selectStockRound.val();
    var now_stockRound_info = stockRounds[selectedValue - 1];
    var priceMatch = now_stockRound_info.match(/價格 ([+-]?\d+)/);
    var price = priceMatch ? Number(priceMatch[1]) : 0;
    selectedStocks.forEach(function (selectedStock) {
      selectedStock['sellPrice'] = selectedStock['buyPrice'] + price;
    });
  }

  // 更新房屋的賣出價格
  function updateHouseSellPrices() {
    var selectedValue = selectHouseRound.val();
    var now_houseRound_info = houseRounds[selectedValue - 1];
    var priceMatch = now_houseRound_info.match(/價格 ([+-]?\d+)/);
    var price = priceMatch ? Number(priceMatch[1]) : 0;
    selectedHouses.forEach(function (selectedHouse) {
      selectedHouse['sellPrice'] = selectedHouse['buyPrice'] + price;
    });
  }

  // 監聽現金輸入框的變化
  var cashInput = $('span:contains("輸入手上的現金")').next('input');
  cashInput.on('input', function () {
    updateTotalAssets();
  });

  // 初始化
  loadLists();
  updateTotalDividends();
  updateTotalRent();
  updateAssetsExcludingCash();
  updateTotalAssets();

  function makeDraggable($element) {
    var isDragging = false;
    var offsetX, offsetY;

    $element.on('mousedown touchstart', function (e) {
      e.preventDefault();

      var clientX, clientY;
      if (e.type === 'touchstart') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      offsetX = clientX - $element.offset().left;
      offsetY = clientY - $element.offset().top;

      if (!isDragging) {
        $(document).on('mousemove touchmove', onMove);
        $element.css('cursor', 'grab');
        isDragging = true;
      } else {
        $(document).off('mousemove touchmove', onMove);
        $element.css('cursor', 'default');
        isDragging = false;
      }
    });

    function onMove(e) {
      var clientX, clientY;
      if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      $element.css({
        left: clientX - offsetX + 'px',
        top: clientY - offsetY + 'px',
      });
    }

    $(document).on('mouseup touchend', function () {
      if (isDragging) {
        $(document).off('mousemove touchmove', onMove);
        $element.css('cursor', 'default');
        isDragging = false;
      }
    });
  }

  makeDraggable($('#star'));
});
