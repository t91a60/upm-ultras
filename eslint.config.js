import js from '@eslint/js';

export default [
  { ignores: ['dist/', 'scripts/'] },

  js.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        HTMLDialogElement: 'readonly',
        URL: 'readonly',
        crypto: 'readonly',
        screen: 'readonly',
        location: 'readonly',
        history: 'readonly',
        matchMedia: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        MutationObserver: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        requestIdleCallback: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        KeyboardEvent: 'readonly',
        import: 'readonly',
      },
    },
    rules: {
      eqeqeq: 'error',
      curly: 'error',
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },

  {
    files: ['public/sw.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        self: 'readonly',
        caches: 'readonly',
        Response: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Promise: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      curly: 'off',
    },
  },

  {
    files: ['__tests__/**'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
  },
];
