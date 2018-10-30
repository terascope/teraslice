'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'update <cluster_sh>';
exports.desc = 'Update a job\n';
exports.builder = (yargs) => {
    cli().args('jobs', 'update', yargs);
    yargs
        .example('earl jobs update cluster1:job:test.json')
        .example('earl jobs update test.json');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'jobs:update').returnConfigData();
    const jobs = _testFunctions || require('./lib')(cliConfig);

    return jobs.update()
        .catch(err => reply.fatal(err.message));
};
