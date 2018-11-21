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
            .option('output', {
                alias: 'o',
                describe: 'Output display format pretty or txt, default is txt',
                choices: ['txt', 'pretty'],
                default: 'txt'
            });
        return yargs.option;
    }

    return {
        args
    };
};
