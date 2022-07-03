module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint',],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended',],
    rules: {
        'quotes': ['error', 'single'],
        'object-curly-spacing': ['error', 'always'],
        'semi': ['error', 'always'],
        'semi-style': ['error', 'last'],
        'eol-last': ['error', 'always'],
    }
};
