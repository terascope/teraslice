'use strict';

const fs = require('fs');
const path = require('path');
const rules = require('./rules');

let hasTypescript;
try {
    require.resolve('typescript');
    hasTypescript = true;
} catch (err) {
    hasTypescript = false;
}

const overrides = [];
if (hasTypescript) {
    const project = [];
    try {
        const pkg = JSON.parse(fs.readFileSync('./package.json'));

        if (fs.existsSync('./tsconfig.json')) {
            project.push('./tsconfig.json');
        }

        if (pkg.workspaces) {
            pkg.workspaces
                .forEach((workspace) => {
                    project.push(
                        ...getTSProjects(workspace)
                            .map((ref) => `./${ref}`)
                    );
                });
        }
    } catch (err) {
        // do nothing
    }

    if (!project.length) {
        const projectOnlyRules = ['@typescript-eslint/no-misused-promises'];
        projectOnlyRules.forEach((rule) => {
            delete rules.typescript[rule];
            delete rules.react[rule];
        });
    }

    overrides.push(
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
                project: project.length ? project : undefined,
                ecmaFeatures: {
                    modules: true,
                    jsx: true,
                },
                useJSXTextNode: true,
            },
            rules: rules.react,
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
                project: project.length ? project : undefined,
                ecmaFeatures: {
                    modules: true,
                    jsx: false,
                },
            },
            rules: rules.typescript,
        }
    );
}

function getTSProjects(workspace) {
    const folderPath = workspace.replace(/\*$/, '');
    if (!fs.existsSync(folderPath)) return [];
    if (fs.existsSync(path.join(folderPath, 'package.json'))) {
        const tsconfigPath = path.join(folderPath, 'tsconfig.json');
        if (fs.existsSync(tsconfigPath)) {
            return [tsconfigPath];
        }
        return [];
    }
    return fs
        .readdirSync(folderPath)
        .filter((pkgName) => {
            const pkgDir = path.join(folderPath, pkgName);

            if (!fs.statSync(pkgDir).isDirectory()) return false;
            const tsConfigPath = path.join(pkgDir, 'tsconfig.json');
            return fs.existsSync(tsConfigPath);
        })
        .map((pkgName) => path.join(folderPath, pkgName, 'tsconfig.json'));
}

module.exports = overrides;
