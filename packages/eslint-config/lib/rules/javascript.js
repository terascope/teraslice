import { INDENT } from './constants.js';

export default {
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
    'import/named': 'off',
    'no-underscore-dangle': 'off',
    'no-param-reassign': ['error', { props: false }],
    'no-use-before-define': ['error', { functions: false }],
    'import/no-dynamic-require': 'off',
    // this is just annoying and doesn't help much
    'no-useless-return': 'off',
    'global-require': 'off',
    strict: ['error', 'global'],
    'prefer-promise-reject-errors': 'warn',
    'no-restricted-globals': ['error', 'isFinite'],
    'func-names': ['error', 'as-needed'],
    'no-path-concat': 'error',
    'no-debugger': 'error',
    'comma-dangle': 'off',
    camelcase: ['error', {
        properties: 'never',
        ignoreDestructuring: true,
    }],
    'handle-callback-err': ['error', 'error'],
    'import/no-extraneous-dependencies': 'off',
    'class-methods-use-this': 'off',
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'off',
    'no-plusplus': 'off',
    'no-continue': 'off',
    'no-new': 'off',
    'no-console': ['error', { allow: ['warn', 'error', 'time', 'timeEnd'] }],
    'no-unused-expressions': [
        'error',
        { allowTernary: true, allowShortCircuit: true },
    ],
    'no-multiple-empty-lines': [
        'error',
        {
            max: 1,
            maxBOF: 0,
            maxEOF: 0
        }
    ],
    'import/prefer-default-export': 'off',
    'no-empty-function': 'off',
    'prefer-object-spread': 'off',
    'function-paren-newline': 'off',
    'lines-between-class-members': [
        'error',
        'always',
        { exceptAfterSingleLine: true },
    ],
};
