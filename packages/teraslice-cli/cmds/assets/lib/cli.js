'use strict';

const homeDir = require('os').homedir();

module.exports = () => {
    function args(commandLevel1, commandLevel2, yargs) {
        yargs
            .option('config', {
                alias: 'conf',
                describe: 'Config file',
                default: `${homeDir}/.teraslice/config-cli.yaml`
            })
            .option('baseDir', {
                describe: 'specify the base directory to use, defaults to cwd',
                default: process.cwd(),
                type: 'string'
            });
        return yargs.option;
    }

    return {
        args
    };
};
