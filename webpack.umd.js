const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/core/SignInEngine.js',
  output: {
    filename: 'signin-engine.min.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'SignInEngine',
    libraryTarget: 'umd',
    libraryExport: 'default',
    globalObject: 'this'
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      extractComments: false,
      terserOptions: {
        format: {
          comments: false
        }
      }
    })]
  }
};