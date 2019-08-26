'use strict';

const defaultJSRules = {
    // airbnb overrides
    indent: ['error', 4],
    'max-len': ['error', {
        code: 100,
        tabWidth: 4,
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

const defaultTSRules = Object.assign({}, defaultJSRules, {
    // typescript preferences
    '@typescript-eslint/prefer-interface': 'off',
    '@typescript-eslint/no-object-literal-type-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowHigherOrderFunctions: true,
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
    }],
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    // The following rules make compatibility between eslint and typescript
    'consistent-return': 'off',
    indent: 'off',
    '@typescript-eslint/indent': ['error', 4],
    'no-underscore-dangle': 'off',
    'no-useless-constructor': 'off',
    '@typescript-eslint/prefer-for-of': ['error'],
    camelcase: 'off',
    '@typescript-eslint/camelcase': ['error', { properties: 'never' }],
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
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
    rules: Object.assign({}, defaultJSRules),
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
            rules: Object.assign({}, defaultTSRules, {
                // react rules
                'react/require-default-props': 'off',
                'react/jsx-filename-extension': [2, { extensions: ['.jsx', '.tsx'] }],
                'react/forbid-prop-types': 'off',
                'react/prop-types': [2, { skipUndeclared: true, ignore: ['children'] }],
                'react/no-array-index-key': 'off',
                'react/destructuring-assignment': 'off',
            }),
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
            rules: Object.assign({}, defaultTSRules),
        },
    ],
};
