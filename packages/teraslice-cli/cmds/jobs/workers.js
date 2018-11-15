'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'workers <cluster_sh> <job_id> <action> <num>';
exports.desc = 'Manage workers in job\n';
exports.builder = (yargs) => {
    cli().args('jobs', 'workers', yargs);
    yargs
        .choices('action', ['add', 'remove'])
        .example('teraslice-cli jobs workers cluster1 99999999-9999-9999-9999-999999999999 add 5')
        .example('teraslice-cli jobs workers cluster1 99999999-9999-9999-9999-999999999999 remove 5');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'jobs:workers').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);
    return job.workers()
        .catch(err => reply.fatal(err.message));
};
