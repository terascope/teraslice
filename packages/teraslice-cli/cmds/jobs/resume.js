'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'resume <cluster_sh> [job]';
exports.desc = 'Resume all running and failing job on cluster.\n';
exports.builder = (yargs) => {
    cli().args('jobs', 'resume', yargs);
    yargs
        .option('annotate', {
            alias: 'n',
            describe: 'add grafana annotation',
            default: ''
        })
        .option('all', {
            alias: 'a',
            describe: 'resume all paused jobs',
            default: false
        })
        .example('earl jobs resume cluster1:job:99999999-9999-9999-9999-999999999999')
        .example('earl jobs resume cluster1:job:99999999-9999-9999-9999-999999999999 --yes')
        .example('earl jobs resume cluster1 --all');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'jobs:resume').returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.resume()
        .catch(err => reply.fatal(err.message));
};
