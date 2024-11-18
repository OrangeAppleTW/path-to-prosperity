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
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database'; // 引入 Realtime Database
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import $ from 'jquery';

// Firebase 配置
const firebaseConfig = {
  apiKey: 'AIzaSyAhrrjOkQUk5vnYrGzZQSkUkEsXU15ya2M',
  authDomain: 'path-to-prosperity.firebaseapp.com',
  databaseURL:
    'https://path-to-prosperity-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'path-to-prosperity',
  storageBucket: 'path-to-prosperity.appspot.com',
  messagingSenderId: '346731969351',
  appId: '1:346731969351:web:4a9ced7e508c1edd242a62',
  measurementId: 'G-N8XYGB34H5',
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// 如果需要 Analytics，可以取消註解以下代碼
// const analytics = getAnalytics(app);

// 將 Firebase 和 jQuery 暴露到全域變數（如果需要在 HTML 中直接訪問）
// window.firebase = { app, auth, db };
// window.$ = $;

// 導出 Firebase 實例
export { app, auth, db };
