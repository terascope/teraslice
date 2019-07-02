#!/usr/bin/env node

'use strict';

/* eslint-disable no-console */

const path = require('path');
const execa = require('execa');
const yargs = require('yargs');
const { listPackages, rootDir } = require('./helpers');
const { generateTSDocs, isTSDocCompatible } = require('./helpers/docs');

const desc = 'A script to ensure documentation and configuration files are up-to-date';
const packages = listPackages();

const { argv } = yargs
    .usage('$0 [options]', desc, (_yargs) => {
        _yargs
            .option('pkg', {
                type: 'string',
                description: 'Run scripts for particular package',
                choices: packages.map(({ folderName }) => folderName)
            })
            .option('docs', {
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

async function run({ docs, pkg }) {
    if (docs) {
        for (const pkgInfo of packages) {
            if (!isTSDocCompatible(pkgInfo)) continue;

            if (pkg) {
                if (pkg === pkgInfo.folderName) {
                    const outputDir = path.join(
                        rootDir,
                        'docs',
                        'packages',
                        pkgInfo.folderName,
                        'api'
                    );
                    await generateTSDocs(pkgInfo, outputDir);
                }
            } else {
                const subprocess = execa.node(
                    __filename,
                    ['--docs', `--pkg=${pkgInfo.folderName}`],
                    {
                        cwd: rootDir
                    }
                );
                subprocess.stdout.pipe(process.stdout);
                await subprocess;
            }
        }
    }
}

run(argv).catch((err) => {
    console.error(err);
});
