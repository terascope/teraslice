'use strict';

const homeDir = require('os').homedir();

exports.args = (yargs) => {
    yargs
        .option('config_dir', {
            alias: 'config_directory',
            describe: 'Config file',
            default: `${homeDir}/.teraslice`
        })
        .option('output', {
            alias: 'o',
            describe: 'Output display format pretty or txt, default is txt',
            choices: ['txt', 'pretty'],
            default: 'txt'
        });
    return yargs.option;
};
