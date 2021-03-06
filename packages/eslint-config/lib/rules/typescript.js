'use strict';

const { INDENT } = require('./constants');
const jsRules = require('./javascript');

module.exports = Object.assign({}, jsRules, {
    // typescript preferences
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    // this is often better turned off, even though types are good
    // it is a little more strict than it should be
    '@typescript-eslint/explicit-function-return-type': 'off',

    // we SHOULD really make this an error but we've become dependent on it
    '@typescript-eslint/ban-ts-comment': ['warn', {
        'ts-expect-error': false,
        'ts-ignore': true,
        'ts-nocheck': false,
        'ts-check': false,
    }],

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
    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': ['error'],
    'no-undef': 'off',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    'func-call-spacing': 'off',
    '@typescript-eslint/func-call-spacing': ['error', 'never'],
    indent: 'off',
    '@typescript-eslint/indent': ['error', INDENT],
    'no-underscore-dangle': 'off',
    'no-useless-constructor': 'off',
    '@typescript-eslint/prefer-for-of': ['error'],
    camelcase: 'off',
    '@typescript-eslint/naming-convention': [
        'error',
        {
            selector: 'default',
            format: ['camelCase', 'snake_case', 'PascalCase', 'UPPER_CASE'],
            leadingUnderscore: 'allow',
            trailingUnderscore: 'allow',
            filter: {
                // you can expand this regex to add more allowed names
                regex: '^__',
                match: false
            }
        },
        {
            selector: 'typeLike',
            format: ['PascalCase', 'UPPER_CASE'],
            leadingUnderscore: 'allow',
            trailingUnderscore: 'allow',
            filter: {
                regex: '^xLucene',
                match: false
            }
        },
    ],
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error', {
        functions: false,
        classes: false,
        typedefs: false
    }],
    'import/no-unresolved': 'off',
    'import/extensions': 'off',
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
