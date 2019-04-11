#!/usr/bin/env node

'use strict';

/* eslint-disable no-console */

const semver = require('semver');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const yargs = require('yargs');

const packagesPath = path.join(process.cwd(), 'packages');
const packages = fs.readdirSync(packagesPath).filter((pkgName) => {
    const pkgDir = path.join(packagesPath, pkgName);

    if (!fs.statSync(pkgDir).isDirectory()) return false;
    return fs.existsSync(path.join(pkgDir, 'package.json'));
});

const desc = 'Update a package to specific version and its dependencies. This should be run in the root of the workspace.';

const { argv } = yargs.usage('$0 [options] <package-name> <release>', desc, (_yargs) => {
    _yargs
        .example('$0', 'job-components major // 0.15.0 => 1.0.0')
        .example('$0', 'teraslice-cli minor // 0.5.0 => 0.6.0')
        .example('$0', 'teraslice patch // 0.20.0 => 0.20.1')
        .example('$0', 'job-components premajor // 0.15.0 => 1.0.0-rc.0')
        .example('$0', 'teraslice-cli preminor // 0.5.0 => 0.6.0-rc.0')
        .example('$0', 'teraslice prepatch // 0.20.0 => 0.20.1-rc.0')
        .example('$0', 'teraslice prerelease // 0.20.1-rc.0 => 0.20.1-rc.1')
        .option('prelease-id', {
            default: 'rc',
            description: 'Specify the prerelease identifier, defaults to RC'
        })
        .option('deps', {
            default: true,
            type: 'boolean',
            description: 'Bump all of the child dependencies to change, (if the child depedency is teraslice it will skip it)'
        })
        .positional('package-name', {
            choices: packages,
            description: 'The name of the package to bump'
        })
        .positional('release', {
            description: 'Specify the release change for the version, see https://www.npmjs.com/package/semver',
            choices: [
                'major',
                'minor',
                'patch',
                'prerelease',
                'premajor',
                'preminor',
                'prepatch',
            ]
        })
        .requiresArg([
            'package-name',
            'release'
        ]);
})
    .scriptName('yarn bump')
    .version()
    .alias('v', 'version')
    .help()
    .alias('h', 'help')
    .detectLocale(false)
    .wrap(yargs.terminalWidth());

const { release, deps } = argv;
const pkgName = argv['package-name'];
const preId = argv['prelease-id'];

const pkgPath = path.join(packagesPath, pkgName, 'package.json');

const pkgJSON = fse.readJsonSync(pkgPath);
const realPkgName = pkgJSON.name;

function bumpVersion(_version) {
    let version = _version;

    version = semver.inc(version, release, preId);
    if (!version) {
        throw new Error(`Failure to increment version "${pkgJSON.version}" using "${release}"`);
    }

    return version;
}

const newVersion = bumpVersion(pkgJSON.version);


console.log(`* Updating ${realPkgName} to version ${pkgJSON.version} to ${newVersion}`);

pkgJSON.version = newVersion;

fse.writeJSONSync(pkgPath, pkgJSON, {
    spaces: 4,
});

function updatePkgVersion(fileName) {
    const otherPkgDir = path.join(packagesPath, fileName);
    const otherPkgPath = path.join(otherPkgDir, 'package.json');
    if (fs.statSync(otherPkgDir).isDirectory()) {
        let otherPkgJSON;

        try {
            otherPkgJSON = fse.readJsonSync(otherPkgPath);
        } catch (err) {
            console.error(`Unable to read package.json for package ${fileName}`);
            return;
        }

        if (otherPkgJSON.dependencies && otherPkgJSON.dependencies[realPkgName]) {
            otherPkgJSON.dependencies[realPkgName] = `^${newVersion}`;
        } else if (otherPkgJSON.devDependencies && otherPkgJSON.devDependencies[realPkgName]) {
            otherPkgJSON.devDependencies[realPkgName] = `^${newVersion}`;
        } else {
            return;
        }

        if (deps && fileName !== 'teraslice') {
            const updatedVersion = bumpVersion(otherPkgJSON.version);
            console.log(`* Updating dependency ${otherPkgJSON.name} to version ${updatedVersion}`);
            otherPkgJSON.version = updatedVersion;
        }

        console.log(`* Updating dependency ${otherPkgJSON.name}'s version of ${pkgJSON.name} to ^${newVersion}`);
        fse.writeJSONSync(otherPkgPath, otherPkgJSON, {
            spaces: 4,
        });
    }
}

fs.readdirSync(packagesPath).forEach(updatePkgVersion);

updatePkgVersion('../e2e');

console.log('DONE!');
