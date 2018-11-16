'use strict';
'use console';

const AssetSrc = require('./lib/AssetSrc');


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
    // build asset in cwd
    yargs.example('earl assets build');
    // build asset in specified baseDir
    yargs.example('earl assets build --baseDir /path/to/myAsset/');
};


exports.handler = async (argv) => {
    const asset = new AssetSrc(argv.srcDir);
    asset.build();
};
