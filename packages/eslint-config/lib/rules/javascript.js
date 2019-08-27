'use strict';

const { INDENT } = require('./constants');

module.exports = {
    // airbnb overrides
    indent: ['error', INDENT],
    'max-len': ['error', {
        code: 100,
        tabWidth: INDENT,
        ignoreUrls: true,
        ignoreComments: false,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
    }],
    'no-underscore-dangle': 'off',
    'no-param-reassign': ['error', { props: false }],
    'no-use-before-define': ['error', { functions: false }],
    'import/no-dynamic-require': 'off',
    'global-require': 'off',
    strict: ['error', 'global'],
    'prefer-promise-reject-errors': 'warn',
    'no-restricted-globals': ['error', 'isFinite'],
    'func-names': ['error', 'as-needed'],
    'no-path-concat': 'error',
    'no-debugger': 'error',
    'comma-dangle': 'off',
    'handle-callback-err': ['error', 'error'],
    'import/no-extraneous-dependencies': 'off',
    'class-methods-use-this': 'off',
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'off',
    'no-plusplus': 'off',
    'no-continue': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-unused-expressions': [
        'error',
        { allowTernary: true, allowShortCircuit: true },
    ],
    'import/prefer-default-export': 'off',
    'no-empty-function': 'off',
    'prefer-object-spread': 'off',
    'consistent-return': ['error', { treatUndefinedAsUnspecified: true }],
    'lines-between-class-members': [
        'error',
        'always',
        { exceptAfterSingleLine: true },
    ],
};
