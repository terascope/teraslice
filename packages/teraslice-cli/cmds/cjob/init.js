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
    config(cliConfig, 'job:init').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.init()
        .catch(err => reply.fatal(err.message));
};
