#!/usr/bin/env node
// 將 src/assets/images/ 下所有 PNG/JPG 轉換為 WebP（保留原檔）

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const IMAGES_DIR = path.resolve(__dirname, '../src/assets/images');

function getImageFiles(dir) {
  return fs.readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f));
}

async function convertToWebP(files) {
  let converted = 0;
  let skipped = 0;

  for (const file of files) {
    const input = path.join(IMAGES_DIR, file);
    const output = path.join(IMAGES_DIR, file.replace(/\.(png|jpe?g)$/i, '.webp'));

    if (fs.existsSync(output)) {
      skipped++;
      continue;
    }

    await sharp(input).webp({ quality: 80 }).toFile(output);
    console.log(`  ✓ ${file} → ${path.basename(output)}`);
    converted++;
  }

  console.log(`\n完成：轉換 ${converted} 張，略過已存在 ${skipped} 張`);
}

const files = getImageFiles(IMAGES_DIR);
console.log(`找到 ${files.length} 張圖片，開始轉換為 WebP...\n`);
convertToWebP(files).catch((err) => {
  console.error('轉換失敗：', err);
  process.exit(1);
});
