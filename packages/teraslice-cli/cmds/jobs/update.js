'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'update';
exports.desc = 'Update a job\n';
exports.builder = (yargs) => {
    cli().args('job', 'update', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'job:update').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.update()
        .catch(err => reply.fatal(err.message));
};
