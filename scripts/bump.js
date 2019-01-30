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

const desc = `Update a package to specific version and its dependencies.
This should be run in the root of the workspace.`;

const { argv } = yargs.usage('$0 [options] <package-name> <release>', desc, (y) => {
    y.option('rc', {
        type: 'boolean',
        description: 'Change this to indicate a RC release'
    }).option('inc', {
        type: 'boolean',
        implies: 'rc',
        description: 'Increment the RC version as well as version'
    }).positional('package-name', {
        choices: packages,
        description: 'The name of the package to bump'
    }).positional('release', {
        choices: [
            'major',
            'minor',
            'patch',
        ]
    })
        .requiresArg(['package-name', 'release']);
}).scriptName('bump')
    .version()
    .alias('v', 'version')
    .help()
    .alias('h', 'help')
    .detectLocale(false)
    .wrap(yargs.terminalWidth());

const { release } = argv;
const pkgName = argv['package-name'];

const pkgPath = path.join(packagesPath, pkgName, 'package.json');

const pkgJSON = fse.readJsonSync(pkgPath);
const realPkgName = pkgJSON.name;

let newVersion;

function incPrerelease(_version) {
    let version = _version;

    let result = semver.prerelease(newVersion);
    if (result) {
        version = version.replace(
            result.join(''),
            result.join('.')
        );
    }

    const prerelease = argv.inc ? `pre${release}` : 'prerelease';
    newVersion = semver.inc(version, prerelease, 'rc');
    if (!newVersion) {
        throw new Error(`Failure to increment version "${pkgJSON.version}" using "${prerelease}"`);
    }

    result = semver.prerelease(newVersion);

    if (result) {
        newVersion = newVersion.replace(
            result.join('.'),
            [result[0], ++result[1]].join('')
        );
    }
}

if (argv.rc) {
    incPrerelease(pkgJSON.version);
} else {
    newVersion = semver.inc(pkgJSON.version, release);
    if (!newVersion) {
        throw new Error(`Failure to increment version "${pkgJSON.version}" using "${release}"`);
    }
}


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

        console.log(`* Updating ${otherPkgJSON.name} dependency version to ^${newVersion}`);
        fse.writeJSONSync(otherPkgPath, otherPkgJSON, {
            spaces: 4,
        });
    }
}

fs.readdirSync(packagesPath).forEach(updatePkgVersion);

updatePkgVersion('../e2e');

console.log('DONE!');
