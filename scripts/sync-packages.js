#!/usr/bin/env node

'use strict';

/* eslint-disable no-console */

const path = require('path');
const fs = require('fs');
const yargs = require('yargs');

const packagesPath = path.join(process.cwd(), 'packages');
const packages = fs.readdirSync(packagesPath).filter((pkgName) => {
    const pkgDir = path.join(packagesPath, pkgName);

    if (!fs.statSync(pkgDir).isDirectory()) return false;
    return fs.existsSync(path.join(pkgDir, 'package.json'));
});

const desc = 'A script to ensure documentation and configuration files are up-to-date';

const { argv } = yargs
    .usage('$0 [options]', desc, (_yargs) => {
        _yargs.option('docs', {
            default: true,
            type: 'boolean',
            description: 'Update the documentation'
        });
    })
    .version()
    .alias('v', 'version')
    .help()
    .alias('h', 'help')
    .detectLocale(false)
    .wrap(yargs.terminalWidth());
