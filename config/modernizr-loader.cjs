// modernizr-loader 1 uses Webpack's removed loader.exec API. The input is
// repository-owned JSON; parse it directly and keep Modernizr module-scoped.
module.exports = function modernizrLoader(source) {
  this.cacheable();
  const done = this.async();
  const config = JSON.parse(source);
  require('modernizr').build(config, output => {
    done(null, `
      const hadModernizr = Object.prototype.hasOwnProperty.call(window, 'Modernizr');
      const previousModernizr = window.Modernizr;
      ${output}
      module.exports = window.Modernizr;
      if (hadModernizr) window.Modernizr = previousModernizr;
      else delete window.Modernizr;
    `);
  });
};
