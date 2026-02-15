const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/core/SignInEngine.js',
  output: {
    filename: 'signin-engine.cjs.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: 'commonjs2'
    }
  },
  optimization: {
    minimize: true
  }
};