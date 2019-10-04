const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, './publish.js'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/dist/',
    filename: 'move-priority.js',
    library: 'movePriority',
    libraryTarget: 'umd',
  },
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/,
    }],
  },
  resolve: {
    extensions: ['.js'],
  },
  performance: {
    hints: false,
  },
  optimization: {
    minimize: true,
  },
};

if (process.env.ANALYZE === 'true') {
  module.exports.plugins = (module.exports.plugins || []).concat([
    new BundleAnalyzerPlugin(),
  ]);
}
