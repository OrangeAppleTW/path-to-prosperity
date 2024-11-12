// webpack.config.js

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin'); // 引入 CopyWebpackPlugin

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  entry: {
    index: './src/js/index.js',
    studentLobby: './src/js/student-lobby.js',
    teacherLobby: './src/js/teacher-lobby.js',
    student: './src/js/student.js',
    teacher: './src/js/teacher.js',
    common: './src/js/common.js', // 共用的 JavaScript
    styles: './src/scss/custom.scss', // 新增自訂的 Sass 文件
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    assetModuleFilename: 'assets/images/[name][ext][query]', // 修改此行
    clean: true, // 清理 /dist 資料夾
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(sa|sc|c)ss$/i, // 修改為支援 Sass 文件
        use: [
          'style-loader',
          'css-loader',
          'sass-loader', // 加入 sass-loader
        ],
      },
      {
        test: /\.(mp3|wav|ogg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/sounds/[name][ext][query]',
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name][ext][query]', // 確保與 output.assetModuleFilename 一致
        },
        use: [
          {
            loader: 'image-webpack-loader',
            options: {
              disable: !isProduction, // 關閉在非生產環境
              mozjpeg: {
                progressive: true,
                quality: 65,
              },
              optipng: {
                enabled: false,
              },
              pngquant: {
                quality: [0.65, 0.9],
                speed: 4,
              },
              gifsicle: {
                interlaced: false,
              },
            },
          },
        ],
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[hash][ext][query]',
        },
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery', // 新增這行
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['@popperjs/core', 'default'], // 添加這行
      Bootstrap: 'bootstrap',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/assets/images'),
          to: path.resolve(__dirname, 'dist/assets/images'),
        },
        {
          from: path.resolve(__dirname, 'src/assets/sounds'),
          to: path.resolve(__dirname, 'dist/assets/sounds'),
        },
      ],
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/pages/index.html',
      chunks: ['common', 'index', 'styles'], // 包含 styles
      favicon: './src/assets/images/favicon.png',
    }),
    new HtmlWebpackPlugin({
      filename: 'copyright.html',
      template: './src/pages/copyright.html',
      chunks: ['common', 'styles'], // 包含 styles
      favicon: './src/assets/images/favicon.png',
    }),
    new HtmlWebpackPlugin({
      filename: 'student-lobby.html',
      template: './src/pages/student-lobby.html',
      chunks: ['common', 'studentLobby', 'styles'], // 包含 styles
      favicon: './src/assets/images/favicon.png',
    }),
    new HtmlWebpackPlugin({
      filename: 'teacher-lobby.html',
      template: './src/pages/teacher-lobby.html',
      chunks: ['common', 'teacherLobby', 'styles'], // 包含 styles
      favicon: './src/assets/images/favicon.png',
    }),
    new HtmlWebpackPlugin({
      filename: 'student.html',
      template: './src/pages/student.html',
      chunks: ['common', 'student', 'styles'], // 包含 styles
      favicon: './src/assets/images/favicon.png',
    }),
    new HtmlWebpackPlugin({
      filename: 'teacher.html',
      template: './src/pages/teacher.html',
      chunks: ['common', 'teacher', 'styles'], // 包含 styles
      favicon: './src/assets/images/favicon.png',
    }),
  ],
  resolve: {
    extensions: ['.js', '.json'],
  },
  mode: isProduction ? 'production' : 'development',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    open: true,
    allowedHosts: 'all',
  },
};
