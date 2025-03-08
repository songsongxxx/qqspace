const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/main.js',  // ����ļ�����������һ�� src/main.js
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
            // Svelte ����ѡ���������������
            emitCss: true,  // �Ƿ� CSS �� JavaScript ����ȡ����
            hotReload: true,  // �Ƿ�����������
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],  // ���ڴ��� CSS �ļ�
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
      template: './public/index.html',  // �������� HTML �ļ�
    }),
  ],
  devServer: {
    contentBase: './dist',
    hot: true,  // ����������
  },
};
