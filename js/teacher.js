function setVH() {
  let vh = $(window).height() * 0.01;
  $(':root').css('--vh', `${vh}px`);
}

// 在加載和窗口調整大小時運行
$(window).on('resize', setVH);
$(window).on('load', setVH);

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
  var drawStockCardSound = new Audio(baseURL + '/static/draw_stock_cards.mp3');
  drawStockCardSound.load(); // 預先加載音頻

  // 預先載入 MP3 文件
  var drawHouseCardSound = new Audio(baseURL + '/static/draw_house_cards.mp3');
  drawHouseCardSound.load(); // 預先加載音頻

  // 預先載入 MP3 文件
  var drawRiskCardSound = new Audio(baseURL + '/static/draw_risk_cards.mp3');
  drawRiskCardSound.load(); // 預先加載音頻

  // 預先載入 MP3 文件
  var drawGameCardSound = new Audio(baseURL + '/static/draw_game_cards.mp3');
  drawGameCardSound.load(); // 預先加載音頻

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

  var isDropdownOpen = false;

  var imageSets = {
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

  // 预加载必要的图片（例如头像）
  var essentialImages = [
    baseURL + '/static/avatar-1.png',
    baseURL + '/static/avatar-2.png',
    baseURL + '/static/avatar-3.png',
    baseURL + '/static/avatar-4.png',
    baseURL + '/static/avatar-5.png',
    baseURL + '/static/avatar-6.png',
    baseURL + '/static/avatar-7.png',
    baseURL + '/static/avatar-8.png',
    baseURL + '/static/game-1.png',
    baseURL + '/static/game-2.png',
    baseURL + '/static/game-3.png',
    baseURL + '/static/game-4.png',
    baseURL + '/static/game-5.png',
    baseURL + '/static/house-1.png',
    baseURL + '/static/house-2.png',
    baseURL + '/static/house-20.png',
    baseURL + '/static/house-3.png',
    baseURL + '/static/house-4.png',
    baseURL + '/static/house-5.png',
    baseURL + '/static/house-6.png',
    baseURL + '/static/house-7.png',
    baseURL + '/static/house-8.png',
    baseURL + '/static/house-9.png',
    baseURL + '/static/house-10.png',
    baseURL + '/static/house-11.png',
    baseURL + '/static/house-12.png',
    baseURL + '/static/house-13.png',
    baseURL + '/static/house-14.png',
    baseURL + '/static/house-15.png',
    baseURL + '/static/house-16.png',
    baseURL + '/static/house-17.png',
    baseURL + '/static/house-18.png',
    baseURL + '/static/house-19.png',
    baseURL + '/static/risk-1.png',
    baseURL + '/static/risk-2.png',
    baseURL + '/static/risk-3.png',
    baseURL + '/static/risk-4.png',
    baseURL + '/static/risk-5.png',
    baseURL + '/static/risk-6.png',
    baseURL + '/static/risk-7.png',
    baseURL + '/static/risk-8.png',
    baseURL + '/static/risk-9.png',
    baseURL + '/static/risk-10.png',
    baseURL + '/static/risk-11.png',
    baseURL + '/static/risk-12.png',
    baseURL + '/static/risk-13.png',
    baseURL + '/static/risk-14.png',
    baseURL + '/static/risk-15.png',
    baseURL + '/static/risk-16.png',
    baseURL + '/static/risk-17.png',
    baseURL + '/static/risk-18.png',
    baseURL + '/static/risk-19.png',
    baseURL + '/static/risk-20.png',
    baseURL + '/static/risk-21.png',
    baseURL + '/static/risk-22.png',
    baseURL + '/static/risk-23.png',
    baseURL + '/static/risk-24.png',
    baseURL + '/static/risk-25.png',
    baseURL + '/static/risk-26.png',
    baseURL + '/static/risk-27.png',
    baseURL + '/static/risk-28.png',
    baseURL + '/static/stock-1.png',
    baseURL + '/static/stock-2.png',
    baseURL + '/static/stock-3.png',
    baseURL + '/static/stock-4.png',
    baseURL + '/static/stock-5.png',
    baseURL + '/static/stock-6.png',
    baseURL + '/static/stock-7.png',
    baseURL + '/static/stock-8.png',
    baseURL + '/static/stock-9.png',
    baseURL + '/static/stock-10.png',
    baseURL + '/static/stock-11.png',
    baseURL + '/static/stock-12.png',
    baseURL + '/static/stock-13.png',
    baseURL + '/static/stock-14.png',
    baseURL + '/static/stock-15.png',
    baseURL + '/static/stock-16.png',
    baseURL + '/static/stock-17.png',
    baseURL + '/static/stock-18.png',
    baseURL + '/static/stock-19.png',
    baseURL + '/static/stock-20.png',
    baseURL + '/static/stock-21.png',
    baseURL + '/static/stock-22.png',
    baseURL + '/static/stock-23.png',
    baseURL + '/static/stock-24.png',
    baseURL + '/static/stock-25.png',
    baseURL + '/static/stock-26.png',
    baseURL + '/static/stock-27.png',
    baseURL + '/static/stock-28.png',
    baseURL + '/static/stock-29.png',
    baseURL + '/static/stock-30.png',
    baseURL + '/static/stock-31.png',
    baseURL + '/static/stock-32.png',
    baseURL + '/static/stock-33.png',
    baseURL + '/static/stock-34.png',
    baseURL + '/static/stock-35.png',
    baseURL + '/static/stock-36.png',
  ];

  var essentialPromises = essentialImages.map(function (path) {
    return preloadImage(path).catch(function (failedPath) {
      console.error('Failed to load image:', failedPath);
    });
  });

  Promise.all(essentialPromises).then(function () {
    console.log('Essential images loaded');
    $('#loading').hide();
    $('#content').show();
    $('#card-loading').hide();
  });

  function preloadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        resolve(img);
      };
      img.onerror = function () {
        reject(src);
      };
      img.src = src;
    });
  }

  let currentInterval; // 全局变量，用于存储当前的定时器

  function changeImage(imagePrefix, maxImages, intervalTime, totalTime) {
    let currentImage = 1;
    let selectedImage = Math.floor(Math.random() * maxImages) + 1;
    let imageSet = imageSets[imagePrefix];

    // 显示加载指示器
    $('#card-loading').show();
    $('.card-sec').hide();
    $('.card-sec').css('background-image', 'none');

    // 禁用所有按钮
    disableButtons(true);

    if (!imageSet.loaded) {
      // 预加载此卡片组的图片
      let imagePromises = [];
      for (let i = 1; i <= maxImages; i++) {
        imagePromises.push(
          preloadImage(baseURL + `/static/${imagePrefix}-${i}.png`)
        );
      }

      Promise.all(imagePromises)
        .then(function (loadedImages) {
          imageSet.loaded = true;
          imageSet.images = loadedImages;

          // 隐藏加载指示器并开始轮播
          $('#card-loading').hide();
          $('.card-sec').show();

          startRotation();
        })
        .catch(function (err) {
          console.error('Error loading images:', err);
          // 处理错误，重新启用按钮
          disableButtons(false);
          $('#card-loading').hide();
        });
    } else {
      // 图片已加载
      $('#card-loading').hide();
      $('.card-sec').show();

      startRotation();
    }

    function startRotation() {
      // 播放音效
      if (imagePrefix == 'stock') {
        drawStockCardSound.currentTime = 0;
        drawStockCardSound.play();
      }
      if (imagePrefix == 'house') {
        drawHouseCardSound.currentTime = 0;
        drawHouseCardSound.play();
      }
      if (imagePrefix == 'risk') {
        drawRiskCardSound.currentTime = 0;
        drawRiskCardSound.play();
      }
      if (imagePrefix == 'game') {
        drawGameCardSound.currentTime = 0;
        drawGameCardSound.play();
      }

      // 开始轮播动画
      currentInterval = setInterval(changeBackground, intervalTime);

      // 在指定时间后停止轮播
      setTimeout(function () {
        clearInterval(currentInterval);

        // 显示随机选中的图片
        $('.card-sec').css(
          'background-image',
          `url('./static/${imagePrefix}-${selectedImage}.png')`
        );

        // 重新启用按钮
        disableButtons(false);
      }, totalTime);
    }

    function changeBackground() {
      $('.card-sec').css(
        'background-image',
        `url('./static/${imagePrefix}-${currentImage}.png')`
      );
      currentImage = currentImage < maxImages ? currentImage + 1 : 1;
    }
  }

  // 共用按钮禁用与启用逻辑
  function disableButtons(disable) {
    $('button').prop('disabled', disable);
  }

  // 为每个按钮设置点击事件
  $('#stock-button').click(function () {
    changeImage('stock', 36, 100, 4000); // 6 秒
    $('#stock-round-select').css({
      'background-color': '#f6ef60',
    });
    $('#house-round-select').css({
      'background-color': '#ffffff',
    });
  });

  $('#house-button').click(function () {
    changeImage('house', 20, 100, 4000); // 6 秒

    $('#stock-round-select').css({
      'background-color': '#ffffff',
    });
    $('#house-round-select').css({
      'background-color': '#f6ef60',
    });
  });

  $('#risk-button').click(function () {
    changeImage('risk', 28, 100, 4500); // 6 秒
    $('#stock-round-select').css({
      'background-color': '#ffffff',
    });
    $('#house-round-select').css({
      'background-color': '#ffffff',
    });
  });

  $('#game-button').click(function () {
    changeImage('game', 5, 100, 4500); // 6 秒
    $('#stock-round-select').css({
      'background-color': '#ffffff',
    });
    $('#house-round-select').css({
      'background-color': '#ffffff',
    });
  });

  $('.avatar').mousedown(function () {
    $('#stock-round-select').css({
      'background-color': '#ffffff',
    });
    $('#house-round-select').css({
      'background-color': '#ffffff',
    });
  });

  var gameRounds = [
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

  // 取得 select 元素
  var selectElement = $('#game-round-select');

  // 將陣列中的每個元素作為 option 添加到 select 中
  $.each(gameRounds, function (index, round) {
    selectElement.append(
      $('<option>', {
        value: index + 1,
        text: round,
      })
    );
  });

  selectElement.val(1);

  var selectGameStage = $('#game-round-select');

  selectGameStage.on('mousedown', function () {
    selectGameStageSound.currentTime = 0;
    isDropdownOpen = true;
  });

  selectGameStage.on('change', function () {
    if (isDropdownOpen) {
      selectGameStageSound.play();
      isDropdownOpen = false;
    }
  });

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

  // 取得 select 元素
  var selectElement = $('#stock-round-select');

  // 將陣列中的每個元素作為 option 添加到 select 中
  $.each(stockRounds, function (index, round) {
    selectElement.append(
      $('<option>', {
        value: index + 1,
        text: round,
      })
    );
  });

  selectElement.val(6);

  var selectStockStage = $('#stock-round-select');

  selectStockStage.on('mousedown', function () {
    selectStockStageSound.currentTime = 0;
    isDropdownOpen = true;
  });

  selectStockStage.on('change', function () {
    if (isDropdownOpen) {
      selectStockStageSound.play();
      isDropdownOpen = false;
    }
  });

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

  // 取得 select 元素
  var selectElement = $('#house-round-select');

  // 將陣列中的每個元素作為 option 添加到 select 中
  $.each(houseRounds, function (index, round) {
    selectElement.append(
      $('<option>', {
        value: index + 1,
        text: round,
      })
    );
  });

  selectElement.val(6);

  var selectHouseStage = $('#house-round-select');

  selectHouseStage.on('mousedown', function () {
    selectHouseStageSound.currentTime = 0;
    isDropdownOpen = true;
  });

  selectHouseStage.on('change', function () {
    if (isDropdownOpen) {
      selectHouseStageSound.play();
      isDropdownOpen = false;
    }
  });

  var insuranceRounds = [
    '保險：賣完就沒囉！目前還有 10 張保險卡',
    '保險：賣完就沒囉！目前只剩下 9 張保險卡',
    '保險：賣完就沒囉！目前只剩下 8 張保險卡',
    '保險：賣完就沒囉！目前只剩下 7 張保險卡',
    '保險：賣完就沒囉！目前只剩下 6 張保險卡',
    '保險：賣完就沒囉！目前只剩下 5 張保險卡',
    '保險：賣完就沒囉！目前只剩下 4 張保險卡',
    '保險：賣完就沒囉！目前只剩下 3 張保險卡',
    '保險：賣完就沒囉！目前只剩下 2 張保險卡',
    '保險：賣完就沒囉！目前只剩下 1 張保險卡',
    '保險：沒有保險卡可以買囉！',
  ];

  // 取得 select 元素
  var selectElement = $('#insurance-round-select');

  // 將陣列中的每個元素作為 option 添加到 select 中
  $.each(insuranceRounds, function (index, round) {
    selectElement.append(
      $('<option>', {
        value: index + 1,
        text: round,
      })
    );
  });

  selectElement.val(1);

  var selectInsuranceStage = $('#insurance-round-select');

  selectInsuranceStage.on('mousedown', function () {
    selectInsuranceStageSound.currentTime = 0;
    isDropdownOpen = true;
  });

  selectInsuranceStage.on('change', function () {
    if (isDropdownOpen) {
      selectInsuranceStageSound.play();
      isDropdownOpen = false;
    }
  });

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

  // 將拖動功能應用到每個圖片元素
  for (var i = 1; i <= 10; i++) {
    makeDraggable($('#avatar-' + i));
  }
});
