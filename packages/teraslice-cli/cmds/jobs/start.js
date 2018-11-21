'use strict';
'use console';

const _ = require('lodash');
const homeDir = require('os').homedir();
const reply = require('../lib/reply')();
const configChecks = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'start <cluster_sh> [job_id]';
exports.desc = 'starts all job on the specified in the saved state file \n';
exports.builder = (yargs) => {
    cli().args('jobs', 'start', yargs);
    yargs
        .option('annotate', {
            alias: 'n',
            describe: 'add grafana annotation',
            default: ''
        })
        .option('all', {
            alias: 'a',
            describe: 'stop all running/failing jobs',
            default: false
        })
        .option('state-file-dir', {
            alias: 'd',
            describe: 'Directory to save job state files to.',
            default: `${homeDir}/.teraslice/job_state_files`
        })
        .example('teraslice-cli jobs start cluster1 99999999-9999-9999-9999-999999999999')
        .example('teraslice-cli jobs start cluster1 99999999-9999-9999-9999-999999999999 --yes')
        .example('teraslice-cli jobs start cluster1 --all');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    configChecks(cliConfig, 'jobs:start').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.start()
        .catch(err => reply.fatal(err.message));
};
