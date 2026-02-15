const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/core/SignInEngine.js',
  output: {
    filename: 'signin-engine.esm.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: 'module',
    },
    module: true,
    environment: {
      module: true
    }
  },
  experiments: {
    outputModule: true
  },
  optimization: {
    minimize: true
  }
};