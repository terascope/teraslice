import js from "@eslint/js";
import jest from 'eslint-plugin-jest';
import globals from "globals";
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react';
import { rules, ignores } from './lib/index.js';

import tsEslint from 'typescript-eslint';

const typescriptLint = tsEslint.config(
    js.configs.recommended,
    ...tsEslint.configs.recommended,
    {
        rules: rules.typescript
    }
  );

// TODO: Temporary disabling of plugins checking spec files
typescriptLint[2].ignores = ['**/test/**']

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
        plugins: {
            'react-hooks': reactHooks,
            react
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            ...rules.react,
        }
    },
    // {
    //     // overrides just for spec files
    //     files: ['*-spec.js', '*-spec.ts', '*-spec.tsx', '*-spec.jsx'],
    //     plugins: {
    //         jest
    //     },
    //     rules: {
    //         ...rules.jest,
    //     }
    // },
    ...typescriptLint,

    {
        // overrides just for spec files
        files: [ '**/*.-spec.{js,ts,tsx,jsx}'],
        ...jest.configs['flat/all'],
        rules: {
            ...jest.configs['flat/all'].rules,
            ...rules.jest,
        }
    },
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
