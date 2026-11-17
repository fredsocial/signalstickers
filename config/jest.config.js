const path = require('path');

module.exports = {
  rootDir: path.resolve(__dirname, '..'),
  testEnvironment: 'node',
  testRegex: '^.+\\.spec\\.[jt]sx?$',
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'node', 'json'],
  collectCoverageFrom: ['src/**/*.{ts,tsx,js,jsx}', '!src/**/*.d.ts'],
  clearMocks: true,
  modulePaths: ['<rootDir>/src'],
  coverageThreshold: {
    global: { statements: 100, branches: 95, functions: 100, lines: 100 }
  }
};
