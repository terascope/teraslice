'use strict';

const { INDENT } = require('./constants');
const jsRules = require('./javascript');

module.exports = Object.assign({}, jsRules, {
    // typescript preferences
    '@typescript-eslint/prefer-interface': 'off',
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    // we should enable this in the future
    // '@typescript-eslint/explicit-function-return-type': ['warn', {
    //     allowHigherOrderFunctions: true,
    //     allowExpressions: true,
    //     allowTypedFunctionExpressions: true,
    // }],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-empty-function': 'off',

    // we SHOULD really have this but we've become depedent on it
    '@typescript-eslint/ban-ts-ignore': 'off',

    // https://github.com/typescript-eslint/typescript-eslint/issues/291
    'no-dupe-class-members': 'off',
    'lines-between-class-members': 'off',

    // The following rules make compatibility between eslint rules and typescript rules
    'consistent-return': 'off',
    'brace-style': 'off',
    '@typescript-eslint/brace-style': [
        'error',
        '1tbs',
        {
            allowSingleLine: true
        }
    ],
    'no-extra-parens': 'off',
    '@typescript-eslint/no-extra-parens': [
        'off',
        'all',
        {
            conditionalAssign: true,
            nestedBinaryExpressions: false,
            returnAssign: false,
            ignoreJSX: 'all',
            enforceForArrowConditionals: false
        }
    ],
    'func-call-spacing': 'off',
    '@typescript-eslint/func-call-spacing': ['error', 'never'],
    indent: 'off',
    '@typescript-eslint/indent': ['error', INDENT],
    'no-underscore-dangle': 'off',
    'no-useless-constructor': 'off',
    '@typescript-eslint/prefer-for-of': ['error'],
    camelcase: 'off',
    '@typescript-eslint/camelcase': ['error', {
        properties: 'never'
    }],
    '@typescript-eslint/class-name-casing': ['error', {
        allowUnderscorePrefix: true
    }],
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
