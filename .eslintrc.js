module.exports = {
  parser: 'babel-eslint',
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    'no-console': 'off',
  },
};
