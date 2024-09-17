import stylistic from '@stylistic/eslint-plugin';
import { INDENT } from './constants.js';

export default {
    ...stylistic.configs['recommended-flat'].rules,
    '@stylistic/indent': ['error', INDENT],
    '@stylistic/semi': ['error', 'always'],
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
    '@stylistic/space-infix-ops': ['error', { int32Hint: false }]
};
