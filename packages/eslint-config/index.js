import { fileURLToPath } from 'node:url';
import { fixupPluginRules } from '@eslint/compat';
import jest from 'eslint-plugin-jest';
import jestDOM from 'eslint-plugin-jest-dom';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import react from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import stylistic from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import { rules, ignores } from './lib/index.js';


/*
import/no-import-module-exports
*/

import tsEslint from 'typescript-eslint';
// console.log('styles', stylistic)
const dirname = fileURLToPath(new URL('../..', import.meta.url));
// console.log("jest.configs['flat/recommended']", jest.configs['flat/recommended'])
const typescriptLint = tsEslint.config(
    ...tsEslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                // tsconfigRootDir: dirname,
                warnOnUnsupportedTypeScriptVersion: false,
                allowDefaultProject: ['*.js*']
            }
        },
        rules: {
            ...rules.typescript
        }
    }
).map((obj) => {
    if (!obj.plugins) {
        obj.ignores = ['**/*.js', '**/test/**'];
    }
    return obj;
});

// TODO: Temporary disabling of plugins checking spec files
// typescriptLint[2].ignores = ['**/test/**'];

// console.log('\n', tsEslint.configs.recommended[0])
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
        files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
        plugins: {
            'react-hooks': fixupPluginRules(reactHooks),
            'testing-library': fixupPluginRules(testingLibraryPlugin),
            'jsx-a11y': jsxA11y,
            react
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        linterOptions: {
            reportUnusedDisableDirectives: 'warn'
        },
        rules: {
            ...rules.react,
        }
    },
    ...typescriptLint,
    {
        // overrides just for spec files
        files: ['**/*-spec.{js,ts,tsx,jsx}'],
        // ...jest.configs['flat/recommended'],
        plugins: {
            jest,
            'jest-dom': jestDOM
        },
        rules: {
            ...rules.jest,
        }
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.jest,
            }
        }
    },
    {
        plugins: {
            '@stylistic': stylistic
        },
        rules: {
            ...rules.styles
        }
    }
];

console.dir(eslintConfig[eslintConfig.length - 1].rules, { depth: 40 });
export default eslintConfig;
