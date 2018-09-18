#!/usr/bin/env node

'use strict';

/* eslint-disable no-console */

const semver = require('semver');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const pkgName = process.argv[2];
const release = process.argv[3];

function usage() {
    console.error('USAGE: bump <package-name> <[major|minor|patch]>');
    console.error('');
    console.error('Description: Update a package to specific version and its dependencies.');
    console.error('             This should be run in the root of the workspace.');
    console.error('');
    console.error('Arguments:');
    console.error('  -h, --help         print this help text');
    console.error('');
}

const isHelp = process.argv.find(arg => arg === '--help' || arg === '-h');

if (isHelp || process.argv.length === 2) {
    usage();
    process.exit(0);
}

if (!pkgName) {
    usage();
    console.error('Missing package name as first arg');
    process.exit(1);
}

if (!release) {
    usage();
    console.error('Missing release as second arg');
    process.exit(1);
}

const packagesPath = path.join(process.cwd(), 'packages');

const pkgPath = path.join(packagesPath, pkgName, 'package.json');

if (!fse.pathExistsSync(pkgPath)) {
    console.error(`Unable to find package.json at path ${pkgPath}`);
    process.exit(1);
}

const pkgJSON = fse.readJsonSync(pkgPath);
const realPkgName = pkgJSON.name;

const newVersion = semver.inc(pkgJSON.version, release);
console.log(`* Updating ${realPkgName} to version ${pkgJSON.version} to ${newVersion}`);

pkgJSON.version = newVersion;

fse.writeJSONSync(pkgPath, pkgJSON, {
    spaces: 2,
});

fs.readdirSync(packagesPath).forEach((fileName) => {
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

        if (otherPkgJSON.dependencies[realPkgName]) {
            otherPkgJSON.dependencies[realPkgName] = `^${newVersion}`;
        } else if (otherPkgJSON.devDependencies[realPkgName]) {
            otherPkgJSON.devDependencies[realPkgName] = `^${newVersion}`;
        } else {
            return;
        }

        console.log(`* Updating ${otherPkgJSON.name} dependency version to ^${newVersion}`);
        fse.writeJSONSync(otherPkgPath, otherPkgJSON, {
            spaces: 4,
        });
    }
});

console.log('DONE! Don\'t forget to run "yarn" to update your yarn.lock');
