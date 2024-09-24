import { fixupPluginRules } from '@eslint/compat';
import jest from 'eslint-plugin-jest';
import jestDOM from 'eslint-plugin-jest-dom';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import react from 'eslint-plugin-react';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import stylistic from '@stylistic/eslint-plugin';
import tsEslint from 'typescript-eslint';
import { rules, ignores } from './lib/index.js';

/**
    TODO: check to see if import plugins works with eslint 9
 */

const typescriptLint = tsEslint.config(
    ...tsEslint.configs.recommended,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                warnOnUnsupportedTypeScriptVersion: false,
                allowDefaultProject: ['*.{js,cjs,mjs}']
            }
        },
        rules: {
            ...rules.typescript
        }
    }
).map((obj) => {
    if (!obj.plugins) {
        obj.ignores = ['**/*.js'];
    }
    return obj;
});

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
            react,
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
        },
    }
];

export default eslintConfig;
