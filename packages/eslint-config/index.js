import js from "@eslint/js";
import globals from "globals";
import { rules, ignores } from './lib/index.js';

/** @type {import('eslint').Linter.FlatConfig[]} */
const eslintConfig = [
    {
        // In your eslint.config.js file, if an ignores key is used without any other
        // keys in the configuration object, then the patterns act as global ignores.
        ignores
    },
    {
        files: ['**/*.{js,mjs,cjs}'],
        rules: rules.javascript
    },
    {
        // overrides just for react files
        files: ['*.jsx', '*.tsx'],
        ignores,
        plugins: ['@typescript-eslint', '@typescript-eslint/recommended', 'react-hooks/recommended', 'airbnb'],
        parser: '@typescript-eslint/parser',
        env: {
            jest: true,
            jasmine: false,
            node: false,
            browser: true,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: rules.react,
    },
    {
        // overrides just for typescript files
        files: ['*.ts'],
        ignores,
        plugins: ['@typescript-eslint', '@typescript-eslint/recommended', 'airbnb-base'],
        parser: '@typescript-eslint/parser',
        rules: rules.typescript,
    },
    {
        // overrides just for spec files
        files: ['*-spec.js', '*-spec.ts', '*-spec.tsx', '*-spec.jsx'],
        plugins: ['jest'],
        env: {
            'jest/globals': true
        },
        rules: rules.jest,
    },
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.jest
            }
        }
    }
]

export default eslintConfig;
