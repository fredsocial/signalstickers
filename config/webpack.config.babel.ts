import path from 'path';

import webpack from 'webpack';

// Plugins.
import FetchStickerDataPlugin from '@signalstickers/fetch-sticker-data-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import HomePreloadPlugin from './home-preload-plugin';
import type { Configuration as DevServerConfiguration } from 'webpack-dev-server';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';


/**
 * Resolve the path to our package root once. Used throughout configuration.
 */
const PKG_ROOT = path.resolve(__dirname, '..');


export default (env: {analyze?: boolean; fixture?: boolean} = {}, argv: any): webpack.Configuration => {
  const config: webpack.Configuration & {devServer?: DevServerConfiguration} = {};
  config.target = ['web', 'es2019'];
  config.module = {rules: []};
  config.plugins = [];


  // ----- Entry / Output ------------------------------------------------------

  config.entry = {
    app: [
      // As of Babel 7.4.0, @babel/polyfill has been deprecated in favor of
      // directly including core-js/stable (to polyfill ECMAScript features) and
      // regenerator-runtime/runtime (needed to use transpiled generator
      // functions).
      'core-js/stable',
      'regenerator-runtime/runtime',
      // Required in development to support hot-reloading.
      argv.mode === 'development' ? 'react-hot-loader/patch' : '',
      path.resolve(PKG_ROOT, 'src', 'index.tsx')
    ].filter(Boolean)
  };

  config.output = {
    path: path.resolve(PKG_ROOT, env.fixture ? 'dist-fixture' : 'dist'),
    filename: argv.mode === 'production' ? '[name]-[chunkhash].js' : '[name].js',
    chunkFilename: '[name]-[chunkhash].js',
    clean: argv.mode === 'production'
  };


  // ----- Loaders -------------------------------------------------------------

  // TypeScript & JavaScript files.
  config.module.rules!.push({
    test: /\.(ts|tsx|js|jsx)$/,
    exclude: /node_modules/,
    use: [{
      loader: 'babel-loader',
      options: {
        cacheDirectory: true
      }
    }, {
      loader: 'linaria/loader',
      options: {
        sourceMap: argv.mode === 'development'
      }
    }]
  });

  // query-string 10's security-fixed decoder uses Unicode-set regex syntax.
  // Compile these dependencies for older Safari before minifying the gallery.
  const queryDirectory = path.dirname(require.resolve('query-string'));
  config.module.rules!.push({
    test: /\.m?js$/,
    include: [
      queryDirectory,
      path.dirname(require.resolve('filter-obj', {paths: [queryDirectory]})),
      path.dirname(require.resolve('split-on-first', {paths: [queryDirectory]}))
    ],
    use: [{
      loader: 'babel-loader',
      options: {
        babelrc: false,
        configFile: false,
        presets: [['@babel/preset-env', {targets: {safari: '13', ios: '13'}, modules: false}]]
      }
    }]
  });

  // Stylesheets.
  config.module.rules!.push({
    test: /\.css$/,
    use: [{
      loader: MiniCssExtractPlugin.loader
    }, {
      loader: 'css-loader',
      options: {
        sourceMap: argv.mode === 'development'
      }
    }]
  });

  // SVG.
  config.module.rules!.push({
    test: /\.svg$/,
    use: [{
      loader: '@svgr/webpack',
      options: {jsxRuntime: 'classic'}
    }]
  });

  // Other images.
  config.module.rules!.push({
    test: /\.(png|jpg|gif)$/,
    use: [{
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: 'assets/[name].[hash].[ext]'
      }
    }]
  });

  // Text files.
  config.module.rules!.push({
    test: /\.txt$/,
    use: [{
      loader: 'raw-loader'
    }]
  });

  // Fonts.
  config.module.rules!.push({
    test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
    use: [{
      loader: 'url-loader',
      options: {
        limit: 10000
      }
    }]
  });

  // Modernizr.
  config.module.rules!.push({
    type: 'javascript/auto',
    test: /modernizr-config\.json?$/,
    use: [{
      loader: path.resolve(PKG_ROOT, 'config/modernizr-loader.cjs')
    }]
  });


  // ----- Module Resolution ---------------------------------------------------

  config.resolve = {
    modules: [path.resolve(PKG_ROOT, 'src'), 'node_modules'],
    alias: {
      // This tells Webpack to load our Modernizr configuration file whenever we
      // import a module named 'modernizr'. The loader rule above will then
      // match our config file being loaded and pass it to modernizr-loader
      // which will create a custom Modernizr build per our configuration and
      // return the resulting JavaScript to the file that imported it.
      'modernizr$': path.resolve(PKG_ROOT, 'config', 'modernizr-config.json'),
      // Use the @hot-loader variant of react-dom in development to avoid this
      // issue: https://github.com/gatsbyjs/gatsby/issues/11934#issuecomment-469046186
      'react-dom': argv.mode === 'production' ? 'react-dom' : '@hot-loader/react-dom'
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  };


  // ----- Icons ---------------------------------------------------------------

  const iconsBaseConfig: Exclude<ConstructorParameters<typeof FaviconsWebpackPlugin>[0], string> = {
    logo: '',
    mode: 'webapp',
    inject: true,
    prefix: 'icons/',
    favicons: {
      appName: 'Signal Stickers',
      appDescription: '',
      version: '',
      developerName: '',
      developerURL: '',
      icons: {
        android: false,
        appleIcon: false,
        appleStartup: false,
        favicons: false,
        windows: false,
        yandex: false,
      }
    }
  };

  // Favicons.
  config.plugins.push(new FaviconsWebpackPlugin({...iconsBaseConfig,
    logo: path.resolve(PKG_ROOT, 'src', 'assets', 'favicon.png'),
    prefix: 'icons/favicon/',
    favicons: {...iconsBaseConfig.favicons,
      icons: {...iconsBaseConfig.favicons?.icons,
        favicons: true,
      }
    }
  }));

  // App icon.
  config.plugins.push(new FaviconsWebpackPlugin({...iconsBaseConfig,
    logo: path.resolve(PKG_ROOT, 'src', 'assets', 'app-icon.png'),
    prefix: 'icons/app/',
    favicons: {...iconsBaseConfig.favicons,
      icons: {...iconsBaseConfig.favicons?.icons,
        appleIcon: true,
        android: true
      }
    }
  }));

  // Apple startup splash screen.
  config.plugins.push(new FaviconsWebpackPlugin({...iconsBaseConfig,
    logo: path.resolve(PKG_ROOT, 'src', 'assets', 'launch-screen.png'),
    prefix: 'icons/startup/',
    favicons: {...iconsBaseConfig.favicons, background: '#007BFF',
      icons: {...iconsBaseConfig.favicons?.icons,
        appleStartup: true
      }
    }
  }));


  // ----- Plugins -------------------------------------------------------------

  config.plugins.push(new HtmlWebpackPlugin({
    filename: 'index.html',
    template: path.resolve(PKG_ROOT, 'src', 'index.html'),
    inject: true
  }));

  // Add resource hints to preload assets used in the initial chunk. This plugin
  // must be added after html-webpack-plugin.
  config.plugins.push(new HomePreloadPlugin());

  config.plugins.push(new MiniCssExtractPlugin({
    filename: argv.mode === 'production' ? '[name]-[contenthash].css' : 'styles.css'
  }));

  config.plugins.push(new webpack.LoaderOptionsPlugin({
    minimize: argv.mode === 'production'
  }));

  config.plugins.push(new FetchStickerDataPlugin({
    inputFile: path.resolve(PKG_ROOT, env.fixture ? 'tests/fixtures/stickers.yml' : 'stickers.yml'),
    outputFile: 'stickerData.json'
  }));

  config.plugins.push(new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(argv.mode)
  }));

  if (argv.mode === 'production') {
    config.plugins.push(new CopyWebpackPlugin({
      patterns: [{
        // When performing a production build, instruct Webpack to copy all
        // files in the 'static' directory into the build directory.
        from: path.resolve(PKG_ROOT, 'static'),
        to: '.'
      }]
    }));

    // TypeScript also checks production compilation; NPS runs ESLint first.
    config.plugins.push(new ForkTsCheckerWebpackPlugin({
      typescript: {
        diagnosticOptions: {
          semantic: true,
          syntactic: true
        }
      }
    }));

    if (env.analyze) {
      console.log('Performing bundle analysis. Bundle report will be opened in your default browser.');
      config.plugins.push(new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        // Use gzipped sizes in the report, because this is the amount of data
        // we will actually be sending to the user.
        defaultSizes: 'gzip'
      }));
    }
  }


  // ----- Dev Server ----------------------------------------------------------

  if (argv.mode === 'development') {
    config.devServer = {
      port: 8080,
      compress: true,
      historyApiFallback: true,
      host: '127.0.0.1',
      hot: true,
      client: {overlay: true}
    };
  }


  // ----- Misc ----------------------------------------------------------------

  config.resolve.fallback = {dgram: false, fs: false, net: false, tls: false, child_process: false};

  config.devtool = argv.mode === 'development' ? 'eval-source-map' : 'source-map';

  config.optimization = {
    minimize: argv.mode === 'production',
    splitChunks: {
      chunks: 'all'
    }
  };

  config.stats = 'minimal';

  return config;
};
