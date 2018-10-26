'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'status <cluster_sh>';
exports.desc = 'List the job status of running and failing job.\n';
exports.builder = (yargs) => {
    cli().args('jobs', 'status', yargs);
    yargs
        .option('status', {
            alias: 's',
            describe: 'list of job status to include',
            default: 'running,failing'
        })
        .example('earl jobs status cluster1')
        .example('earl jobs status cluster1 --status failed');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'jobs:status').returnConfigData();
    const jobs = _testFunctions || require('./lib')(cliConfig);
    return jobs.status()
        .catch(err => reply.fatal(err.message));
};
