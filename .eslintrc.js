module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {project: './tsconfig.json', tsconfigRootDir: __dirname, sourceType: 'module', ecmaFeatures: {jsx: true}},
  env: {node: true},
  plugins: ['@typescript-eslint', 'prefer-arrow', 'unicorn', 'react', 'react-hooks', 'jsx-a11y'],
  extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended', 'plugin:jsx-a11y/recommended', 'eslint:recommended', 'plugin:@typescript-eslint/eslint-recommended', 'plugin:@typescript-eslint/recommended'],
  settings: {react: {version: 'detect'}},
  rules: {
    ...require('./config/eslint-legacy-rules.json'),
    'no-console': 'off',
    'no-confusing-arrow': 'off'
  },
  overrides: [
    {files: ['*.spec.*', '*.test.*'], rules: {'@typescript-eslint/require-await': 'off', '@typescript-eslint/naming-convention': 'off', '@typescript-eslint/no-var-requires': 'off'}},
    {files: ['*.tsx'], env: {browser: true}}
  ]
};
