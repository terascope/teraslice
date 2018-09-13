'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const configChecks = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'stop';
exports.desc = 'stops all job running or failing on the cluster, saves running job to a json file.\n';
exports.builder = (yargs) => {
    cli().args('job', 'stop', yargs);
    yargs
        .option('annotate', {
            alias: 'a',
            describe: 'add grafana annotation',
            default: false
        });
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    configChecks(cliConfig).returnConfigData();
    const jobLib = _testFunctions || require('./lib')(cliConfig);

    return jobLib.stopJobs()
        .catch(err => reply.fatal(err.message));
};
