module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    mocha: true,
  },
  extends: [
    'xo',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    indent: ['error', 2],
    'space-in-parens': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    camelcase: ['error', { properties: 'never', allow: ['request_hash', 'checked_hash', /influx_.*/] }],
    radix: ['error', 'as-needed'],
    'no-multiple-empty-lines': 'error',
    'max-params': ['error', { max: 5 }],
    'new-cap': ['warn', { properties: false }],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: ['const', 'var', 'let', 'multiline-const', 'multiline-var', 'multiline-let'], next: '*' },
      { blankLine: 'any', prev: ['const', 'var', 'let', 'multiline-const', 'multiline-var', 'multiline-let'], next: ['const', 'var', 'let', 'multiline-const', 'multiline-var', 'multiline-let'] },
      { blankLine: 'always', prev: ['block', 'block-like'], next: '*' },
      { blankLine: 'always', prev: '*', next: 'return' },
    ],
  },
};
