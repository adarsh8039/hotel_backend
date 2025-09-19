module.exports = {
  env: {
    // "browser": true,
    es6: true,
    node: true,
  },
  extends: 'airbnb-base',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 1,
    'no-undef': 2,
    'no-case-declarations': 2,
    'no-empty': 1,
    'no-redeclare': 2,
    'no-console': 'off',
    'max-len': ['error', { code: 200 }],
    camelcase: 'off',
  },
};
