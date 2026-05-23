import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.svelte'],
    rules: {
      // We don't compile to custom elements, so the rest-element warning isn't relevant.
      'svelte/valid-compile': ['error', { ignoreWarnings: true }],
    },
  },
  {
    ignores: ['dist/**', 'dev-dist/**', 'node_modules/**', 'public/**', '*.config.js'],
  },
];
