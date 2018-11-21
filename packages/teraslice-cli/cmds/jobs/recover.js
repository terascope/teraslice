'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'recover <cluster_sh> <job_id>';
exports.desc = 'Run recovery on cluster.\n';
exports.builder = (yargs) => {
    cli().args('jobs', 'recover', yargs);
    yargs
        .example('teraslice-cli jobs recover cluster1 99999999-9999-9999-9999-999999999999');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'jobs:recover').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.recover()
        .catch(err => reply.fatal(err.message));
};
