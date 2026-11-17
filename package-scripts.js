module.exports = {
  scripts: {
    typeCheck: 'tsc --pretty --noEmit',
    lint: {
      script: 'eslint --ext .ts,.tsx src tests',
      fix: 'eslint --ext .ts,.tsx src tests --fix'
    },
    test: {
      script: 'jest --config=config/jest.config.js --runInBand && npm run test:client',
      watch: 'jest --config=config/jest.config.js --watch'
    },
    build: {
      script: 'nps typeCheck lint && webpack --mode=production --config=config/webpack.config.babel.ts',
      analyze: 'nps typeCheck lint && webpack --mode=production --config=config/webpack.config.babel.ts --env analyze=true'
    },
    start: 'webpack serve --mode=development --config=config/webpack.config.babel.ts',
    prepare: 'nps build test'
  }
};
