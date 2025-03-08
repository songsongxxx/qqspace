const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/main.js',  // 入口文件，假设你有一个 src/main.js
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.svelte$/,
        use: {
          loader: 'svelte-loader',
          options: {
            // Svelte 配置选项可以在这里设置
            emitCss: true,  // 是否将 CSS 从 JavaScript 中提取出来
            hotReload: true,  // 是否启用热重载
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],  // 用于处理 CSS 文件
      },
    ],
  },
  resolve: {
    alias: {
      svelte: path.resolve('node_modules', 'svelte'),
    },
    extensions: ['.mjs', '.js', '.svelte'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',  // 用于生成 HTML 文件
    }),
  ],
  devServer: {
    contentBase: './dist',
    hot: true,  // 开启热重载
  },
};
