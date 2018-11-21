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
            })
            .option('info', {
                alias: 'i',
                describe: 'show cluster info',
                default: false
            })
            .option('yes', {
                alias: 'y',
                describe: 'Answer \'Yes\' or \'Y\' to all prompts',
                default: false
            });
        return yargs.option;
    }

    return {
        args
    };
};
