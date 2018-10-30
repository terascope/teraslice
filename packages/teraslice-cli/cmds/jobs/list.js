'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'list <cluster_sh> [job]';
exports.desc = 'List the status of running and failing job.\n';
exports.builder = (yargs) => {
    cli().args('jobs', 'list', yargs);
    yargs
        .example('earl jobs list cluster1')
        .example('earl jobs list http://cluster1.net:80');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'jobs:list').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.list()
        .catch(err => reply.fatal(err.message));
};
