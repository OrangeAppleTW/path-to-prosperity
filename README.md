# 財富之路 Path to Prosperity

這是一款理財教育網頁遊戲，旨在幫助玩家學習基本的財務知識和決策。

## 技術棧 (Tech Stack)

*   **前端 (Frontend):**
    *   HTML5
    *   CSS3 (Bootstrap 5)
    *   JavaScript (ES6)
*   **後端與資料庫 (Backend & Database):**
    *   Firebase Realtime Database
*   **建置工具 (Build Tool):**
    *   Webpack
    *   Babel
*   **音效 (Audio):**
    *   Howler.js
*   **部署 (Deployment):**
    *   GitHub Pages

## 開發 (Local Development)

請依照以下步驟在本機環境設定專案：

1.  **複製專案庫**
    ```bash
    git clone https://github.com/orangeapple/path-to-prosperity.git
    cd path-to-prosperity
    ```

2.  **安裝依賴套件**
    本專案使用 `npm` 來管理套件。
    ```bash
    npm install
    ```

3.  **建置專案**
    執行以下指令，Webpack 會將原始碼打包到 `dist` 資料夾中。
    ```bash
    npm run build
    ```

4.  **在本機預覽**
    由於瀏覽器的安全性限制 (CORS policy)，你無法直接透過 `file://` 協議打開 `dist/pages/index.html` 來執行。
    建議使用一個簡單的本地伺服器來預覽，例如 `http-server`。
    ```bash
    # 如果你沒有安裝 http-server，可以透過 npx 直接執行
    npx http-server .

    # 接著在瀏覽器中打開對應的網址，例如 http://localhost:8080/src/pages/
    ```

## 部署 (Deployment)

本專案設定了兩種部署到 GitHub Pages 的方式：

### 方式一：自動化部署 (推薦)

這是最推薦的方式。專案已經設定好 GitHub Actions，當有任何程式碼被推送到 `main` 分支時，將會自動觸發部署流程。

**流程說明:**
1.  開發者將新的程式碼推送到 `main` 分支。
2.  GitHub Actions 會自動執行 `.github/workflows/deploy.yml` 中的設定。
3.  Action 會安裝所有依賴套件 (`npm install`)。
4.  執行建置指令 (`npm run build`)，產生最新的 `dist` 資料夾。
5.  將 `dist` 資料夾的內容強制推送到 `gh-pages` 分支。
6.  GitHub Pages 會自動更新網站內容。

你只需要確保所有變更都已合併到 `main` 分支即可。

### 方式二：手動部署

如果你需要手動觸發部署，可以使用 `package.json` 中定義好的指令。

1.  確認你的 `main` 分支是最新版本。
2.  執行建置指令：
    ```bash
    npm run build
    ```
3.  執行部署指令：
    ```bash
    npm run deploy
    ```
    這個指令會使用 `gh-pages` 套件，將 `dist` 資料夾的內容推送到 `gh-pages` 分支。

## 自訂網域 (Custom Domain)

本專案使用 `CNAME` 檔案來設定自訂網域，指向 `oa-cfa.com`。當部署到 GitHub Pages 時，這個檔案會被自動複製到 `gh-pages` 分支的根目錄，以確保網域指向正確。

