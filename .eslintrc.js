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
  },
};
