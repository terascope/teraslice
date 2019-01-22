'use strict';

const homeDir = require('os').homedir();

const Url = require('../lib/url');

const url = new Url();

class Options {
    constructor() {
        this.options = {
            arch: () => ({
                choices: ['x32', 'x64'],
                describe: 'The architecture of the Teraslice cluster.'
                        + '  Determined automatically on newer Teraslice releases.',
                nargs: 1,
                type: 'string'
            }),
            'base-dir': () => ({
                describe: 'The base directory to work in, defaults to cwd',
                default: process.cwd(),
                type: 'string',
                nargs: 1
            }),
            build: () => ({
                describe: 'Build asset from source prior to upload.  The current'
                        + ' directory is used if no argument is passed to this option',
                type: 'boolean'
            }),
            'config-dir': () => ({
                alias: 'd',
                describe: 'Config directory',
                default: `${homeDir}/.teraslice`,
                nargs: 1,
            }),
            file: () => ({
                alias: 'f',
                describe: 'When specified with a path to an asset file, uploads provided'
                        + ' asset without retriving from GitHub.  Useful for offline use.',
                nargs: 1,
                type: 'string'
            }),
            list: () => ({
                describe: 'Output list display',
                type: 'boolean',
                default: false
            }),
            'new-cluster-url': () => ({
                describe: 'new cluster url',
                type: 'string'
            }),
            'node-version': () => ({
                describe: 'The node version of the Teraslice cluster, like: `v8.11.1`, `v10.13.0`'
                        + '  Determined automatically on newer Teraslice releases.',
                nargs: 1,
                type: 'string'
            }),
            output: () => ({
                alias: 'o',
                describe: 'Output display format pretty or txt, default is txt',
                choices: ['txt', 'pretty'],
                default: 'txt'
            }),
            platform: () => ({
                choices: ['darwin', 'linux'],
                describe: 'The platform of the Teraslice cluster.'
                        + '  Determined automatically on newer Teraslice releases.',
                nargs: 1,
                type: 'string'
            }),
            replace: () => ({
                describe: 'Deletes asset prior to upload',
                type: 'boolean'
            }),
            start: () => ({
                describe: 'Option start job immediately after registering it on the cluster',
                alias: 'run',
                type: 'boolean',
                default: false
            }),
            'skip-upload': () => ({
                describe: 'Skips upload to Teraslice, useful to just download the asset.',
                type: 'boolean',
            }),
            'src-dir': () => ({
                describe: 'Path to directory containing asset',
                default: process.cwd(),
                nargs: 1,
                type: 'string'
            }),
            quiet: () => ({
                alias: 'q',
                describe: 'Silence non-error logging.',
                type: 'boolean'
            }),
        };

        this.positionals = {
            asset: () => ({
                describe: 'Github user/repo of asset to load, e.g.: terascope/file-assets',
                nargs: 1,
                type: 'string'
            }),
            'job-name': () => ({
                describe: 'file for cli to ingest, e.g: jobFile.json',
                nargs: 1,
                type: 'string'
            }),
            'asset-name': () => ({
                describe: 'Simple name of the asset, e.g: file-assets.',
                nargs: 1,
                type: 'string'
            }),
            'asset-id': () => ({
                describe: 'Hexidecimal ID of asset.',
                nargs: 1,
                type: 'string'
            }),
            'cluster-alias': () => ({
                describe: 'Teraslice cluster alias',
                nargs: 1,
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
