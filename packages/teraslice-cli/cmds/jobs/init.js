'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'init';
exports.desc = 'Initialize a job\n';
exports.builder = (yargs) => {
    cli().args('job', 'init', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'jobs:init').returnConfigData();
    const jobs = _testFunctions || require('./lib')(cliConfig);

    return jobs.init()
        .catch(err => reply.fatal(err.message));
};
