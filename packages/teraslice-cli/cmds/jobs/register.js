'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const configChecks = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'register <cluster_sh>';
exports.desc = 'starts all job on the specified in the saved state file \n';
exports.builder = (yargs) => {
    cli().args('jobs', 'register', yargs);
    yargs
        .option('annotate', {
            alias: 'n',
            describe: 'add grafana annotation',
            default: ''
        })
        .option('run', {
            alias: 'r',
            describe: 'option to run the job immediately after being registered',
            default: false,
            type: 'boolean'
        })
        .option('asset', {
            alias: 'a',
            describe: 'builds the assets and deploys to cluster, optional',
            default: false,
            type: 'boolean'
        })
        .example('earl jobs register cluster1:job:jobfile.json -a');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    configChecks(cliConfig).returnConfigData();
    const jobsLib = _testFunctions || require('./lib')(cliConfig);

    return jobsLib.register()
        .catch(err => reply.fatal(err.message));
};
