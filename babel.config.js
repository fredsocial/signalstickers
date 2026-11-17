module.exports = {
  presets: [
    ['@babel/preset-env', { modules: 'auto', useBuiltIns: 'entry', corejs: 3, loose: true }],
    ['@babel/preset-react', { runtime: 'classic' }],
    '@babel/preset-typescript',
    require.resolve('linaria/babel')
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    '@babel/plugin-transform-runtime',
    ['module-resolver', {root: ['./src']}],
    'react-hot-loader/babel'
  ],
  comments: true
};
