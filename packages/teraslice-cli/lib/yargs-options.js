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
            config_dir: () => ({
                alias: 'config_directory',
                describe: 'Config directory',
                default: `${homeDir}/.teraslice`
            }),
            output: () => ({
                alias: 'o',
                describe: 'Output display format pretty or txt, default is txt',
                choices: ['txt', 'pretty'],
                default: 'txt'
            }),
            cluster_url: () => ({
                alias: 'c',
                describe: 'cluster url',
                requiresArg: 1,
                type: 'string'
            }),
            new_cluster_url: () => ({
                describe: 'new cluster url',
                type: 'string'
            }),
            cluster_alias: () => ({
                describe: 'cluster alias',
                type: 'string'
            }),
            base_dir: () => ({
                describe: 'specify the base directory to use, defaults to cwd',
                default: process.cwd(),
                type: 'string'
            })
        };

        this.positionals = {
            cluster_alias: () => ({
                describe: 'cluster alias',
                type: 'string'
            }),
            new_cluster_alias: () => ({
                describe: 'new cluster alias to add to config file',
                type: 'string'
            }),
            new_cluster_url: () => ({
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
