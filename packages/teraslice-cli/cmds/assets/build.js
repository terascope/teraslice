'use strict';

const AssetSrc = require('./lib/asset-src');
const reply = require('../lib/reply')();


exports.command = 'build';
exports.desc = 'Builds asset bundle.\n';
exports.builder = (yargs) => {
    yargs.option('d', {
        alias: 'srcDir',
        describe: 'Path to directory containing asset',
        default: process.cwd()
    });
    yargs.option('q', {
        alias: 'quiet',
        describe: 'Silence non-error logging.'
    });
    // build asset found in in cwd
    yargs.example('earl assets build');
    // build asset found in specified baseDir
    yargs.example('earl assets build --baseDir /path/to/myAsset/');
};


exports.handler = async (argv) => {
    try {
        const asset = new AssetSrc(argv.srcDir);
        const buildResult = await asset.build();
        reply.green(`Asset created:\n\t${buildResult}`);
    } catch (err) {
        reply.fatal(`Error building asset: ${err}`);
    }
};
