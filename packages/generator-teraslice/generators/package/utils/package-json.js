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
        pkgName, pkgDirName, pkgVersion, typescript, description, license,
    } = options;

    const common = {
        name: pkgName,
        description,
        version: pkgVersion,
        publishConfig: {
            access: 'public',
        },
        scripts: {
            test: 'ts-scripts test --',
            'test:debug': 'ts-scripts test --debug --',
            'test:watch': 'ts-scripts test --watch --',
        },
        homepage: `https://github.com/terascope/teraslice/tree/master/packages/${pkgDirName}#readme`,
        repository: 'git@github.com:terascope/teraslice.git',
        author: 'Terascope, LLC <info@terascope.io>',
        license,
        bugs: {
            url: 'https://github.com/terascope/teraslice/issues',
        },
        dependencies: {},
        terascope: {
            testSuite: 'unit'
        }
    };

    if (!typescript) {
        return _.defaultsDeep(common, {
            main: 'index.js',
            files: ['*.js', 'lib/**/*'],
            devDependencies: getPkgValues({}),
        });
    }

    return _.defaultsDeep(common, {
        files: ['dist/src/**/*'],
        srcMain: 'src/index.ts',
        main: 'dist/src/index.js',
        typings: 'dist/src/index.d.ts',
        devDependencies: getPkgValues({}),
        scripts: {
            prepublishOnly: 'yarn build',
            build: 'tsc --build',
            'build:watch': 'yarn build --watch',
        },
        terascope: {
            enableTypedoc: true
        }
    });
};
