'use strict';

const _ = require('lodash');

module.exports = (options) => {
    const {
        pkgName,
        pkgDirName,
        pkgVersion,
        typescript,
        description,
        license
    } = options;

    const common = {
        name: pkgName,
        description,
        version: pkgVersion,
        publishConfig: {
            access: 'public'
        },
        homepage: `https://github.com/terascope/teraslice/tree/master/packages/${pkgDirName}#readme`,
        repository: 'git@github.com:terascope/teraslice.git',
        author: 'Terascope, LLC <info@terascope.io>',
        license,
        bugs: {
            url: 'https://github.com/terascope/teraslice/issues'
        },
        dependencies: {}
    };

    if (!typescript) {
        return _.defaultsDeep(common, {
            main: 'index.js',
            files: [
                '*.js',
                'lib/**/*'
            ],
            scripts: {
                lint: 'eslint *.js lib/**/*.js test/**/*.js',
                'lint:fix': 'yarn lint --fix',
                test: 'jest',
                'test:watch': 'jest --coverage=false --notify --watch --onlyChanged',
                'test:debug': "env DEBUG='*teraslice*' jest --detectOpenHandles --coverage=false --runInBand"
            },
            devDependencies: {
                eslint: '^5.12.0',
                'eslint-config-airbnb-base': '^13.1.0',
                'eslint-plugin-import': '^2.14.0',
                jest: '^23.6.0',
                'jest-extended': '^0.11.0'
            }
        });
    }

    return _.defaultsDeep(common, {
        files: [
            'dist/**/*'
        ],
        srcMain: 'src/index.ts',
        main: 'dist/index.js',
        typings: 'dist/index.d.ts',
        scripts: {
            lint: "tslint -p tsconfig.build.json -t verbose -e '**/*.json'",
            'lint:fix': 'yarn lint --fix',
            prepublishOnly: 'yarn build',
            build: 'rimraf ./dist; tsc --project tsconfig.build.json --pretty',
            'build:prod': 'tsc --project tsconfig.build.json',
            'build:watch': 'yarn build --watch',
            test: 'jest',
            'test:watch': 'jest --coverage=false --notify --watch --onlyChanged',
            'test:debug': "env DEBUG='*teraslice*' jest --detectOpenHandles --coverage=false --runInBand",
        },
        devDependencies: {
            '@types/jest': '^23.3.12',
            '@types/node': '^10.12.18',
            'babel-core': '^6.0.0',
            'babel-jest': '^23.6.0',
            jest: '^23.6.0',
            'jest-extended': '^0.11.0',
            rimraf: '^2.6.3',
            'ts-jest': '^23.10.5',
            tslint: '^5.12.1',
            'tslint-config-airbnb': '^5.11.1',
            typescript: '^3.2.4'
        },
    });
};
