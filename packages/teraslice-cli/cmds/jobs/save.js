'use strict';
'use console';

const _ = require('lodash');
const homeDir = require('os').homedir();

const reply = require('../lib/reply')();
const configChecks = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'save <cluster_sh>';
exports.desc = 'Saves all running job on the specified cluster to a json file.\n';
exports.builder = (yargs) => {
    cli().args('jobs', 'save', yargs);

    yargs
        .option('state-file-dir', {
            alias: 'd',
            describe: 'Directory to save job state files to.',
            default: `${homeDir}/.teraslice/job_state_files`
        })
        .example('teraslice-cli jobs save cluster1');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    configChecks(cliConfig, 'jobs:save').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);
    return job.save()
        .catch(err => reply.fatal(err.message));
};
