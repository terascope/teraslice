import path from 'node:path';
import { readdirSync, existsSync } from 'node:fs';
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
import importPlugin from 'eslint-plugin-import';
import { rules, ignores } from './lib/index.js';

function findPackageDirs(dir, depth = 2) {
    if (depth === 0) return [];
    const result = [];
    try {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
            const subdir = path.join(dir, entry.name);
            if (existsSync(path.join(subdir, 'package.json'))) result.push(subdir);
            result.push(...findPackageDirs(subdir, depth - 1));
        }
    } catch {
        // skip inaccessible directories
    }
    return result;
}

const rootDir = process.cwd();
const packageDirs = [rootDir, ...findPackageDirs(rootDir)];

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
        plugins: {
            import: importPlugin
        }
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
        plugins: {
            jest,
            'jest-dom': jestDOM
        },
        rules: {
            ...rules.jest,
            'import/no-extraneous-dependencies': ['error',
                {
                    devDependencies: false,
                    optionalDependencies: false,
                    peerDependencies: false,
                    packageDir: packageDirs
                }]
        }
    },
    {
        // overrides for js/ts files in test directories
        files: ['**/test/**/*.{js,ts,tsx,jsx}'],
        rules: {
            'import/no-extraneous-dependencies': ['error',
                {
                    devDependencies: true,
                    optionalDependencies: false,
                    peerDependencies: false,
                    packageDir: packageDirs
                }]
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
