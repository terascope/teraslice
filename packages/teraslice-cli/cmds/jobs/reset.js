'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'reset';
exports.desc = 'reset a job\n';
exports.builder = (yargs) => {
    cli().args('job', 'reset', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'job:reset').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.reset()
        .catch(err => reply.fatal(err.message));
};
