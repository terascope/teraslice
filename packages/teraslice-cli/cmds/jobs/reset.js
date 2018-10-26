'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'reset <cluster_sh> [job]';
exports.desc = 'reset a job\n';
exports.builder = (yargs) => {
    cli().args('job', 'reset', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'jobs:reset').returnConfigData();
    const jobs = _testFunctions || require('./lib')(cliConfig);

    return jobs.reset()
        .catch(err => reply.fatal(err.message));
};
