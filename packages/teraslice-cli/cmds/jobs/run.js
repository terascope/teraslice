'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'run <cluster_sh> [job]';
exports.desc = 'Run a job\n';
exports.builder = (yargs) => {
    cli().args('jobs', 'run', yargs);
    yargs
        .option('annotate', {
            alias: 'n',
            describe: 'add grafana annotation',
            default: ''
        })
        .example('earl jobs run cluster1:job:99999999-9999-9999-9999-999999999999')
        .example('earl jobs run cluster1:job:99999999-9999-9999-9999-999999999999 --yes');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'jobs:run').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.run()
        .catch(err => reply.fatal(err.message));
};
