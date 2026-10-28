// ESLint flat config — Expo SDK 54 (eslint-config-expo v10+)
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'babel.config.js'],
  },
  {
    rules: {
      // Règles strictes supplémentaires pour BudgetScan
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'unused-imports/no-unused-vars': [
        'warn',
        { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]);
