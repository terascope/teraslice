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
            .option('l', {
                alias: 'localhost',
                describe: 'cluster running on local machine',
                default: false
            });
        return yargs.option;
    }

    return {
        args
    };
};
