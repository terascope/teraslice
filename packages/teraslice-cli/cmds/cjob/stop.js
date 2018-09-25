'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const configChecks = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'stop';
exports.desc = 'stops job(s) running or failing on the cluster, saves running job(s) to a json file.\n';
exports.builder = (yargs) => {
    cli().args('job', 'stop', yargs);
    yargs
        .option('annotate', {
            alias: 'n',
            describe: 'add grafana annotation',
            default: ''
        })
        .option('all', {
            alias: 'a',
            describe: 'stop all running/failing jobs',
            default: false
        });
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    configChecks(cliConfig).returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.stop()
        .catch(err => reply.fatal(err.message));
};
