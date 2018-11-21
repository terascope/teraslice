'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'list <cluster_sh>';
exports.desc = 'List the jobs on the cluster. Defaults to 10 jobs.';
exports.builder = (yargs) => {
    cli().args('jobs', 'list', yargs);
    yargs
        .example('teraslice-cli jobs list cluster1')
        .example('teraslice-cli jobs list http://cluster1.net:80');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'jobs:list').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.list()
        .catch(err => reply.fatal(err.message));
};
