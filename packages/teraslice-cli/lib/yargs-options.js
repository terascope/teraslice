'use strict';

const homeDir = require('os').homedir();

const Url = require('../lib/url');

const url = new Url();

class Options {
    constructor() {
        this.options = {
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
            list: () => ({
                describe: 'Output list display',
                type: 'boolean',
                default: false
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

        this.coerce = {
            'cluster-url': newUrl => url.build(newUrl),
            'new-cluster-url': newUrl => url.build(newUrl)
        };
    }

    buildOption(key, ...args) {
        return this.options[key](...args);
    }

    buildPositional(key, ...args) {
        return this.positionals[key](...args);
    }

    buildCoerce(key) {
        return this.coerce[key];
    }
}


module.exports = Options;
