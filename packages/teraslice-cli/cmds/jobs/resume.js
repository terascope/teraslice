'use strict';
'use console';

const _ = require('lodash');
const homeDir = require('os').homedir();
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'resume <cluster_sh> [job_id]';
exports.desc = 'Resume all running and failing job on cluster.\n';
exports.builder = (yargs) => {
    cli().args('jobs', 'resume', yargs);
    yargs
        .option('annotate', {
            alias: 'n',
            describe: 'add grafana annotation',
            default: ''
        })
        .option('all', {
            alias: 'a',
            describe: 'resume all paused jobs',
            default: false
        })
        .option('state-file-dir', {
            alias: 'd',
            describe: 'Directory to save job state files to.',
            default: `${homeDir}/.teraslice/job_state_files`
        })
        .example('teraslice-cli jobs resume cluster1 99999999-9999-9999-9999-999999999999')
        .example('teraslice-cli jobs resume cluster1 99999999-9999-9999-9999-999999999999 --yes')
        .example('teraslice-cli jobs resume cluster1 --all');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'jobs:resume').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.resume()
        .catch(err => reply.fatal(err.message));
};
