import jsRules from './javascript.js';

export default Object.assign({}, jsRules, {
    // typescript preferences
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/ban-ts-comment': ['warn',
        {
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
                regex: '^__|',
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
    '@typescript-eslint/no-use-before-define': ['error',
        {
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
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
            ignoreRestSiblings: true,
            // TODO: check this again with stylistic checks
            caughtErrors: 'none'
        }
    ],
    '@typescript-eslint/no-empty-object-type': ['warn', { allowInterfaces: 'always' }],
    'no-unused-expressions': 'off',
    // TODO: look into this
    '@typescript-eslint/no-unused-expressions': ['warn', { allowShortCircuit: true, allowTernary: true }],
});
