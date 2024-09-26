import stylistic from '@stylistic/eslint-plugin';
import { INDENT } from './constants.js';

export default {
    ...stylistic.configs['recommended-flat'].rules,
    '@stylistic/max-len': [
        'error',
        {
            code: 100,
            tabWidth: INDENT,
            ignoreUrls: true,
            ignoreComments: false,
            ignoreRegExpLiterals: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
        }
    ],
    '@stylistic/indent': ['error', INDENT],
    '@stylistic/semi': ['error', 'always'],
    '@stylistic/semi-style': ['error', 'last'],
    '@stylistic/function-call-spacing': ['error', 'never'],
    '@stylistic/function-call-argument-newline': ['error', 'consistent'],
    '@stylistic/implicit-arrow-linebreak': ['error', 'beside'],
    '@stylistic/array-element-newline': ['error', { consistent: true, multiline: true }],
    '@stylistic/comma-dangle': ['error', 'only-multiline'],
    '@stylistic/arrow-parens': ['error', 'always'],
    '@stylistic/member-delimiter-style': [
        'error',
        {
            multiline: { delimiter: 'semi', requireLast: true },
            multilineDetection: 'brackets',
            overrides: {
                interface: { multiline: { delimiter: 'semi', requireLast: true } }
            },
            singleline: { delimiter: 'semi' }
        }
    ],
    '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
    '@stylistic/space-infix-ops': ['error', { int32Hint: false }],
    '@stylistic/quote-props': ['error', 'as-needed'],
    '@stylistic/indent-binary-ops': ['error', INDENT],
    '@stylistic/newline-per-chained-call': ['error', { ignoreChainWithDepth: 2 }],
    '@stylistic/no-extra-semi': 'error',
    '@stylistic/nonblock-statement-body-position': ['error', 'beside', { overrides: { while: 'below' } }],
    '@stylistic/jsx-indent-props': ['error', INDENT],
    '@stylistic/jsx-child-element-spacing': 'error',
    '@stylistic/one-var-declaration-per-line': ['error', 'always'],
    '@stylistic/object-curly-newline': ['error', { consistent: true, multiline: true, minProperties: 5 }]
};
