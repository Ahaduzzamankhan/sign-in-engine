const path = require('path');

module.exports = [
  // UMD Build (Browser)
  {
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
      minimize: true
    }
  },
  // CommonJS Build (Node)
  {
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
  }
];