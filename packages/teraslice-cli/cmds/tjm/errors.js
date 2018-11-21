'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'errors <job_file>';
exports.desc = 'List errors for a job on cluster';
exports.builder = (yargs) => {
    cli().args('tjm', 'errors', yargs);
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
    yargs.example('teraslice-cli tjm errors test1.json');
    yargs.example('teraslice-cli tjm errors test1.json --size 10');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'tjm:error').returnConfigData();
    const tjm = _testFunctions || require('./lib')(cliConfig);

    return tjm.errors()
        .catch(err => reply.fatal(err.message));
};
