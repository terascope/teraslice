'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'errors';
exports.desc = 'List errors for all running and failing job on cluster.\n';
exports.builder = (yargs) => {
    cli().args('job', 'errors', yargs);
    yargs
        .option('from', {
            describe: 'error number to start query',
            default: 1
        })
        .option('size', {
            describe: 'size of error query',
            default: 100
        })
        .option('job_id', {
            describe: 'Job id to limit query',
            default: ''
        })
        .option('ex_id', {
            describe: 'Execution id to limit query',
            default: ''
        });
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig).returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.errors()
        .catch(err => reply.fatal(err.message));
};
