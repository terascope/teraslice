'use strict';

const homeDir = require('os').homedir();

class Options {
    constructor() {
        this.options = {
            config: () => ({
                alias: 'conf',
                describe: 'Config file',
                default: `${homeDir}/.teraslice/config-cli.yaml`
            }),
            'config-dir': () => ({
                alias: 'd',
                describe: 'Config directory',
                default: `${homeDir}/.teraslice`
            }),
            output: () => ({
                alias: 'o',
                describe: 'Output display format pretty or txt, default is txt',
                choices: ['txt', 'pretty'],
                default: 'txt'
            }),
            'cluster-url': () => ({
                alias: 'c',
                describe: 'cluster url',
                requiresArg: 1,
                type: 'string'
            }),
            'new-cluster-url': () => ({
                describe: 'new cluster url',
                type: 'string'
            }),
            'cluster-alias': () => ({
                describe: 'cluster alias',
                type: 'string'
            }),
            'base-dir': () => ({
                describe: 'specify the base directory to use, defaults to cwd',
                default: process.cwd(),
                type: 'string'
            })
        };

        this.positionals = {
            'cluster-alias': () => ({
                describe: 'cluster alias',
                type: 'string'
            }),
            'new-cluster-alias': () => ({
                describe: 'new cluster alias to add to config file',
                type: 'string'
            }),
            'new-cluster-url': () => ({
                describe: 'new cluster url to add to the config file',
                type: 'string'
            }),
        };
    }

    buildOption(key, ...args) {
        return this.options[key](...args);
    }

    buildPositional(key, ...args) {
        return this.positionals[key](...args);
    }
}


module.exports = Options;
