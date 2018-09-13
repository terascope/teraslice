'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const configChecks = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'restart';
exports.desc = 'Restarts all job on the specified cluster.\n';
exports.builder = (yargs) => {
    cli().args('jobs', 'restart', yargs);
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
    const job = _testFunctions || require('./lib/')(cliConfig);

    return job.restart()
        .catch(err => reply.fatal(err.message));
};
