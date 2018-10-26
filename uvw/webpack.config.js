
const path = require('path');
const webpack = require('webpack');
const ConcatPlugin = require('webpack-concat-plugin');

module.exports = (env = {}, argv) => {
  let isDev = argv.mode !== 'production';
  let hash = isDev ? 'bundle' : '[hash:8]';
  return {
    entry: {
      'uvw-s4a': ['./client.js'],
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: `[name].${hash}.js`,
    },

    devtool: 'source-map',

    module: {
      rules: [{
        test: /\.js/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      }, {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: { limit: 10000, name: 'img/[name].[hash:7].[ext]' }
      }]
    },

    resolve: {
      alias: {
        events: 'component-emitter'
      }
    },

    plugins:[
      new ConcatPlugin({
          uglify: !isDev,
          sourceMap: false,
          name: 'uvw-s4a-web',
          //outputPath: 'dist/',
          fileName: isDev ? '[name].bundle.js' : '[name].[hash:8].js',
          filesToConcat: [
            '../src/s4a/arduino.js',
            '../src/platforms/web/chromium/root/plugin/arduino.js',
            '../src/platforms/web/chromium/root/plugin/plugin.js',
            '../src/snap/morphic.js',
            '../src/s4a/morphic.js',
            '../src/platforms/web/chromium/root/plugin/morphic.js',
            '../src/snap/locale.js',
            '../src/snap/widgets.js',
            '../src/snap/blocks.js',
            '../src/s4a/blocks.js',
            '../src/snap/threads.js',
            '../src/s4a/threads.js',
            '../src/platforms/web/chromium/root/plugin/threads.js',
            '../src/snap/objects.js',
            '../src/s4a/objects.js',
            '../src/platforms/web/chromium/root/plugin/objects.js',
            '../src/snap/gui.js',
            '../src/s4a/gui.js',
            '../src/platforms/web/chromium/root/plugin/gui.js',
            '../src/snap/paint.js',
            '../src/snap/lists.js',
            '../src/s4a/lists.js',
            '../src/snap/byob.js',
            '../src/snap/tables.js',
            '../src/snap/symbols.js',
            '../src/snap/xml.js',
            '../src/snap/store.js',
            '../src/s4a/store.js',
            '../src/snap/cloud.js',
            '../src/s4a/cloud.js',
            '../src/snap/sha512.js',
            '../src/snap/FileSaver.min.js'
          ],
          attributes: {
            async: true
          }
      })
    ]
  };
};

