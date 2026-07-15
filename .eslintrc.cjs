module.exports = {
  root: true,
  ignorePatterns: ['dist/', 'coverage/', '*.config.d.ts', 'test-results/'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'eslint-config-prettier'
  ],
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  rules: {
    'no-console': ['error', { allow: ['warn', 'error'] }]
  }
};
