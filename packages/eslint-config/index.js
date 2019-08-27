'use strict';

require('./lib/patch-eslint6');
const { rules } = require('./lib');

module.exports = {
    extends: ['airbnb-base'],
    parserOptions: {
        ecmaVersion: 8,
        sourceType: 'script',
    },
    env: {
        node: true,
        jasmine: true,
        jest: true,
    },
    rules: rules.javascript,
    overrides: [
        {
            // overrides just for react files
            files: ['.jsx', '*.tsx'],
            extends: ['plugin:@typescript-eslint/recommended', 'airbnb'],
            plugins: ['@typescript-eslint'],
            parser: '@typescript-eslint/parser',
            env: {
                jest: true,
                jasmine: false,
                node: false,
                browser: true,
            },
            parserOptions: {
                ecmaVersion: 8,
                sourceType: 'module',
                ecmaFeatures: {
                    modules: true,
                    jsx: true,
                },
                useJSXTextNode: true,
            },
            rules: rules.react,
        },
        {
            // overrides just for typescript files
            files: ['*.ts'],
            extends: ['plugin:@typescript-eslint/recommended', 'airbnb-base'],
            plugins: ['@typescript-eslint'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                ecmaVersion: 8,
                sourceType: 'module',
                ecmaFeatures: {
                    modules: true,
                    jsx: false,
                },
            },
            rules: rules.typescript,
        },
    ],
};
