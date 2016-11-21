const path = require('path');
const clone = require('clone');
// const ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin;
// const webpack = require('webpack');
const webpackCommon = require('./webpack.common');

const webpackConfig = Object.assign(clone(webpackCommon), {
  devtool: 'source-map',
  entry: {
    'rxobj': [
      path.resolve('src', 'rxobj.ts'),
    ],
  },
  output: {
    path: path.resolve('build', 'bundle'),
    filename: '[name].js',
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'awesome-typescript' },
    ],
  },
});

// webpackConfig.plugins.push(
//   new ForkCheckerPlugin(),
//   new webpack.optimize.OccurenceOrderPlugin(true),
//   new webpack.optimize.CommonsChunkPlugin({
//     name: [ 'vendor' ],
//   })
// );

module.exports = webpackConfig;
