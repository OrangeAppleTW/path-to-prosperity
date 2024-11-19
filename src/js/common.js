// src/js/common.js

// 引入共用的 CSS
import '../css/styles.css';

// 引入 Bootstrap 的 CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// 引入 Bootstrap Icons 的 CSS
import 'bootstrap-icons/font/bootstrap-icons.css';

// 引入 Bootstrap 的 JavaScript（包含 Popper.js）
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// 引入 js-cookie
import Cookies from 'js-cookie';

// 引入 Firebase 模組
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database'; // 引入 Realtime Database
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import $ from 'jquery';

// Firebase 配置
const firebaseConfig = {
  apiKey: 'AIzaSyDZ6yLJqFsW9zk9ye0g6Z_jgNZnR19BE88',
  authDomain: 'oa-path-to-prosperity.firebaseapp.com',
  databaseURL:
    'https://oa-path-to-prosperity-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'oa-path-to-prosperity',
  storageBucket: 'oa-path-to-prosperity.firebasestorage.app',
  messagingSenderId: '1087785695196',
  appId: '1:1087785695196:web:3164ccf2109ce23c0c8119',
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // 持久性設置成功
  })
  .catch((error) => {
    console.error('設置認證持久性時出錯:', error);
  });

// 導出 Firebase 實例
export { app, auth, db };
