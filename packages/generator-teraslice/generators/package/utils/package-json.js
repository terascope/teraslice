'use strict';

const _ = require('lodash');
const path = require('path');
const fs = require('fs');

module.exports = (options) => {
    const rootPkgJSON = readRootPkgJSON();

    function readRootPkgJSON() {
        const upDirs = _.times(5, () => '..');
        const pkgPath = path.join(__dirname, ...upDirs, 'package.json');
        try {
            return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        } catch (err) {
            return {};
        }
    }

    function getPkgValues(packages) {
        return _.mapValues(packages, (val, name) => {
            if (_.has(rootPkgJSON, ['dependencies', name])) {
                return _.get(rootPkgJSON, ['dependencies', name], val);
            }
            if (_.has(rootPkgJSON, ['devDependencies', name])) {
                return _.get(rootPkgJSON, ['devDependencies', name], val);
            }
            return val;
        });
    }

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
            devDependencies: getPkgValues({
                eslint: '^5.12.1',
                'eslint-config-airbnb-base': '^13.1.0',
                'eslint-plugin-import': '^2.15.0',
                jest: '^23.6.0',
                'jest-extended': '^0.11.0'
            })
        });
    }

    return _.defaultsDeep(common, {
        files: [
            'dist/**/*'
        ],
        srcMain: 'src/index.ts',
        main: 'dist/src/index.js',
        typings: 'dist/src/index.d.ts',
        scripts: {
            lint: "tslint -p tsconfig.json -t verbose -e '**/*.json'",
            'lint:fix': 'yarn lint --fix',
            prepublishOnly: 'yarn build',
            build: 'tsc -b',
            'build:watch': 'yarn build --watch',
            test: 'jest',
            'test:watch': 'jest --coverage=false --notify --watch --onlyChanged',
            'test:debug': "env DEBUG='*teraslice*' jest --detectOpenHandles --coverage=false --runInBand",
        },
        devDependencies: getPkgValues({
            '@types/jest': '^23.3.13',
            '@types/node': '^10.12.18',
            'babel-core': '^6.0.0',
            'babel-jest': '^23.6.0',
            jest: '^23.6.0',
            'jest-extended': '^0.11.0',
            'ts-jest': '^23.10.5',
            tslint: '^5.12.1',
            'tslint-config-airbnb': '^5.11.1',
            typescript: '^3.2.4'
        }),
    });
};
