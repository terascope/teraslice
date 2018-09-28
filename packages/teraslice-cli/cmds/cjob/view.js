'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'view';
exports.desc = 'View the job definition\n';
exports.builder = (yargs) => {
    cli().args('job', 'view', yargs);
    yargs
        .demandCommand(1);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'job:view').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.view()
        .catch(err => reply.fatal(err.message));
};
