'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'view <cluster_sh> <job_id>';
exports.desc = 'View the job definition\n';
exports.builder = (yargs) => {
    cli().args('jobs', 'views', yargs);
    yargs
        .example('teraslice-cli jobs view cluster1 99999999-9999-9999-9999-999999999999');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'jobs:view').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.view()
        .catch(err => reply.fatal(err.message));
};
