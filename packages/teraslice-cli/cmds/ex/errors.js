'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'errors';
exports.desc = 'List errors for all running and failing ex ids on cluster.\n';
exports.builder = (yargs) => {
    cli().args('ex', 'errors', yargs);
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
    const tsuFunctions = _testFunctions || require('../lib/functions')(cliConfig);

    return tsuFunctions.errorsExs()
        .catch(err => reply.fatal(err.message));
};
