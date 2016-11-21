const path = require('path');
const clone = require('clone');
const webpackCommon = require('../webpack.common');

const coverageVariable = '__coverage__';

const atl = `awesome-typescript?${ JSON.stringify({ sourceMap: false, inlineSourceMap: true }) }`;

const webpackConfig = Object.assign(clone(webpackCommon), {
  devtool: 'inline-source-map',
  coverageVariable,
  entry: [
    path.resolve('test', 'rxobj.spec.ts'),
  ],
  output: {
    path: path.resolve('..', 'build', 'test'),
    filename: 'rxobj.spec.js',
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: atl },
    ],
    postLoaders: [
      {
        test: /\.ts$/,
        loader: `istanbul-instrumenter?coverageVariable=${ coverageVariable }`,
        include: [
          path.resolve('src'),
        ],
      },
    ],
  },
});

webpackConfig.plugins[0].definitions.TEST = true;

module.exports = webpackConfig;
