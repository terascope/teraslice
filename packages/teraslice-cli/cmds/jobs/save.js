'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const configChecks = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'save <cluster_sh> [job]';
exports.desc = 'Saves all running job on the specified cluster to a json file.\n';
exports.builder = (yargs) => {
    cli().args('jobs', 'save', yargs);
    yargs
        .example('earl jobs save cluster1');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    configChecks(cliConfig).returnConfigData();
    const job = _testFunctions || require('./lib')(cliConfig);

    return job.save()
        .catch(err => reply.fatal(err.message));
};
