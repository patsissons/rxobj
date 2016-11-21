const webpack = require('webpack');

module.exports = {
  plugins: [
    // eslint-disable-next-line id-match
    new webpack.DefinePlugin({ DEBUG: false, RELEASE: false, TEST: false, WEBPACK_DEV_SERVER: false }),
  ],
  resolve: {
    extensions: [ '', '.ts', '.tsx', '.webpack.js', '.web.js', '.js' ],
  },
  failOnError: true,
};
