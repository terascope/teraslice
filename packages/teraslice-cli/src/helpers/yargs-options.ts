import os from 'os';
import yargs from 'yargs';
import Url from './url';

const homeDir = os.homedir();

const url = new Url();

export default class Options {
    private options: Record<string, (...args: any[]) => yargs.Options> = {
        arch: () => ({
            choices: ['x32', 'x64'],
            describe: 'The architecture of the Teraslice cluster.'
                    + '  Determined automatically on newer Teraslice releases.',
            nargs: 1,
            type: 'string'
        }),
        'await-status': () => ({
            describe: 'desired status to wait for, exits once status is reached',
            type: 'array',
            choices: [
                'pending',
                'scheduling',
                'recovering',
                'initializing',
                'running',
                'failing',
                'paused',
                'stopping',
                'completed',
                'stopped',
                'rejected',
                'failed',
                'terminated'
            ],
            default: ['completed', 'stopped']
        }),
        'await-timeout': () => ({
            describe: 'time in milliseconds to wait for status, exits if timeout expires',
            type: 'number',
            default: 0
        }),
        'base-dir': () => ({
            describe: 'The base directory to work in, defaults to cwd',
            default: process.cwd(),
            type: 'string',
            nargs: 1
        }),

        // TODO: what is default here
        build: () => ({
            describe: 'Build asset from source prior to upload.  The current'
                    + ' directory is used if no argument is passed to this option',
            type: 'boolean'
        }),
        bundle: () => ({
            describe: 'Build the new smaller esbuild asset bundle style asset',
            default: true,
            type: 'boolean'
        }),
        'bundle-target': () => ({
            describe: 'Specify which version of node is used as the target for esbuild.'
                    + ' Defaults to current major node version',
            default: `node${process.version.split('.', 1)[0].substr(1)}`,
            choices: [
                'node14',
                'node16',
                'node18'
            ],
            // I have disabled this because for some reason this requirement was
            // being enforced even when `bundle-target` wasn't specified.
            // Ideally we'd have a way to warn the user that they need to set
            // bundle if bundle-target is set.
            // implies: 'bundle',
            type: 'string'
        }),
        'config-dir': () => ({
            alias: 'd',
            describe: 'Config directory',
            default: `${homeDir}/.teraslice`,
            nargs: 1,
        }),
        debug: () => ({
            describe: 'Enable more verbose debugging output',
            default: false,
            type: 'boolean'
        }),
        file: () => ({
            alias: 'f',
            describe: 'When specified with a path to an asset file, uploads provided'
                    + ' asset without retrieving from GitHub.  Useful for offline use.',
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
        overwrite: () => ({
            describe: 'Overwrite output file.',
            default: false,
            type: 'boolean'
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
        blocking: () => ({
            describe: 'Block the request until it completes',
            type: 'boolean'
        }),
        dev: () => ({
            describe: 'Run command in dev mode, for assets this means excluding the platform, arch, and node_version',
            type: 'boolean'
        }),
        registry: () => ({
            describe: 'Generate or update the registry for an asset',
            type: 'boolean',
            default: false
        }),
        start: () => ({
            describe: 'Option to start job ',
            alias: 'run',
            type: 'boolean',
            default: false
        }),
        processor: () => ({
            describe: 'Option to add a new processor to an asset',
            alias: 'proc',
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
        'ex-status': () => ({
            describe: 'list of ex status to include',
            default: ''
        }),
        'ex-size': () => ({
            describe: 'size of ex error list to return',
            default: 100
        }),
        'ex-from': () => ({
            describe: 'ex error to start from',
            default: 0
        }),
        'ex-sort': () => ({
            describe: 'sort method for ex errors',
            default: '_updated:desc'
        }),
        'jobs-status': () => ({
            describe: 'list of job status to include',
            array: true,
            default: []
        }),
        'jobs-size': () => ({
            describe: 'size of job error list to return',
            default: 100
        }),
        'jobs-from': () => ({
            describe: 'jobs error to start from',
            default: 0
        }),
        'jobs-sort': () => ({
            describe: 'sort method for job errors',
            default: '_updated:desc'
        }),
        'jobs-save': () => ({
            describe: 'saves controller and execution state a job or jobs locally after running command or uses a saved state file and applies commands to saved jobs',
            default: false,
            type: 'boolean'
        }),
        'jobs-watch': () => ({
            alias: 'watch',
            describe: 'watches job for n number of slices, ensures correct number of workers and no failed slices.',
            type: 'number'
        }),
        yes: () => ({
            alias: 'y',
            describe: 'Answer \'Yes\' or \'Y\' to all prompts',
        }),
        quiet: () => ({
            alias: 'q',
            describe: 'Silence non-error logging.',
            type: 'boolean'
        }),
    };

    private positionals: Record<string, (...args: any[]) => yargs.PositionalOptions> = {
        asset: () => ({
            describe: 'Github user/repo of asset to load, e.g.: terascope/file-assets',
            nargs: 1,
            type: 'string'
        }),
        'job-file': () => ({
            describe: 'Job file that tjm will read to execute command on job, e.g: jobFile.json',
            nargs: 1,
            type: 'string'
        }),
        'job-id': () => ({
            describe: 'Id of teraslice job to run the command on. Accepts a single job id or multiple. Use "all" to run the command on all the jobs on the cluster',
            array: true,
            type: 'string'
        }),
        'asset-name': () => ({
            describe: 'Simple name of the asset, e.g: file-assets.',
            nargs: 1,
            type: 'string'
        }),
        'asset-id': () => ({
            describe: 'Hexadecimal ID of asset.',
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
        'worker-number': () => ({
            describe: 'Number of workers to add, remove, or set for a job',
            type: 'number',
            nargs: 1
        }),
        'worker-action': () => ({
            choices: ['add', 'remove', 'total'],
            describe: 'Action to use when adjusting workers',
            nargs: 1,
            type: 'string'
        })
    };

    private coerce: Record<string, (arg: any) => any> = {
        'cluster-url': (newUrl: string) => url.build(newUrl),
        'new-cluster-url': (newUrl: string) => url.build(newUrl)
    };

    buildOption(key: string, ...args: any[]): yargs.Options {
        return this.options[key](...args);
    }

    buildPositional(key: string, ...args: any[]): yargs.PositionalOptions {
        return this.positionals[key](...args);
    }

    buildCoerce(key: string): (arg: any) => any {
        return this.coerce[key];
    }
}
