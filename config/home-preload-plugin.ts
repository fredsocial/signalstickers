import type {Compiler} from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';

/** Preserve the old preload plugin's named home-chunk hints with Webpack 5. */
export default class HomePreloadPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap('HomePreloadPlugin', compilation => {
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tap('HomePreloadPlugin', data => {
        const files = new Set<string>();
        for (const chunk of compilation.chunks) {
          if (chunk.name === 'home') {
            for (const file of chunk.files) {
              if (!file.endsWith('.map')) files.add(file);
            }
          }
        }
        data.headTags.unshift(...Array.from(files).sort().map(file => ({
          tagName: 'link',
          voidTag: true,
          attributes: {
            rel: 'preload',
            href: `${data.publicPath}${file}`,
            as: file.endsWith('.css') ? 'style' : /\.woff2?$/.test(file) ? 'font' : 'script',
            ...(/\.woff2?$/.test(file) ? {crossorigin: 'anonymous'} : {})
          },
          meta: {plugin: 'HomePreloadPlugin'}
        })));
        return data;
      });
    });
  }
}
