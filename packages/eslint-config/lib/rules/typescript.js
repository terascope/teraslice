'use strict';

const { INDENT } = require('./constants');
const jsRules = require('./javascript');

module.exports = Object.assign({}, jsRules, {
    // typescript preferences
    '@typescript-eslint/prefer-interface': 'off',
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    // '@typescript-eslint/explicit-function-return-type': ['warn', {
    //     allowHigherOrderFunctions: true,
    //     allowExpressions: true,
    //     allowTypedFunctionExpressions: true,
    // }],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',

    // https://github.com/typescript-eslint/typescript-eslint/issues/291
    'no-dupe-class-members': 'off',
    'lines-between-class-members': 'off',

    // The following rules make compatibility between eslint and typescript
    'consistent-return': 'off',
    indent: 'off',
    '@typescript-eslint/indent': ['error', INDENT],
    'no-underscore-dangle': 'off',
    'no-useless-constructor': 'off',
    '@typescript-eslint/prefer-for-of': ['error'],
    camelcase: 'off',
    '@typescript-eslint/camelcase': ['error', { properties: 'never' }],
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error', {
        functions: false,
        classes: false,
        typedefs: false
    }],
    'import/no-unresolved': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
        'error',
        {
            vars: 'all',
            args: 'after-used',
            ignoreRestSiblings: true,
            argsIgnorePattern: '^_',
        },
    ],
});
