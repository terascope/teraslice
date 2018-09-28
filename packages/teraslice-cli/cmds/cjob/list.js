'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'list';
exports.desc = 'List the job status of running and failing job.\n';
exports.builder = (yargs) => {
    cli().args('job', 'list', yargs);
    yargs
        .demandCommand(1)
        .option('status', {
            alias: 's',
            describe: 'list of job status to include',
            default: 'running:failing'
        });
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'job:list').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.list()
        .catch(err => reply.fatal(err.message));
};
