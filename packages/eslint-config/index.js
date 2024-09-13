import { fileURLToPath } from 'node:url';
import { fixupPluginRules } from "@eslint/compat";
import js from "@eslint/js";
import jest from 'eslint-plugin-jest';
import globals from "globals";
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import react from 'eslint-plugin-react';
import { rules, ignores } from './lib/index.js';

import tsEslint from 'typescript-eslint';

const dirname = fileURLToPath(new URL('../..', import.meta.url));

const typescriptLint = tsEslint.config(
    ...tsEslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                // tsconfigRootDir: dirname,
                warnOnUnsupportedTypeScriptVersion: false,
                allowDefaultProject: ["*.js*"]
            }
        },
        rules: {
            ...rules.typescript
        }
    }
  ).map((obj) => {
    obj.ignores = ['**/*.js', '**/test/**'];
    return obj;
  });

console.log('js.configs.recommended,', js.configs.recommended,)

// TODO: Temporary disabling of plugins checking spec files
// typescriptLint[2].ignores = ['**/test/**'];

console.log(typescriptLint)
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
    // {
    //     // overrides just for react files
    //     files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    //     plugins: {
    //         'react-hooks': fixupPluginRules(reactHooks),
    //         'testing-library': fixupPluginRules(testingLibraryPlugin),
    //         react
    //     },
    //     languageOptions: {
    //         parserOptions: {
    //             ecmaFeatures: {
    //                 jsx: true,
    //             },
    //         },
    //     },
    //     linterOptions: {
    //         reportUnusedDisableDirectives: "warn"
    //     },
    //     rules: {
    //         ...rules.react,
    //     }
    // },
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
    // {
    //     // overrides just for spec files
    //     files: [ '**/*-spec.{js,ts,tsx,jsx}'],
    //     ...jest.configs['flat/recommended'],
    //     rules: {
    //         ...jest.configs['flat/recommended'].rules,
    //         ...rules.jest,
    //     }
    // },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.jest,
            }
        }
    }
]

export default eslintConfig;
