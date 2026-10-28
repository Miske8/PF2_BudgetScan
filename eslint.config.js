// ESLint flat config — Expo SDK 54 (eslint-config-expo)
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
      'no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          // Signatures déclaratives (ports d'interfaces, factories de test) :
          // les noms de paramètres documentent le contrat, ils ne sont pas "unused".
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ['src/core/ports/**/*.ts', 'src/services/**/*.ts'],
    rules: {
      'no-unused-vars': [
        'warn',
        {
          args: 'none',
          caughtErrors: 'none',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);
