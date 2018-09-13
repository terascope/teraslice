'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const configChecks = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'stop';
exports.desc = 'stops ex that is running or failing on the cluster.\n';
exports.builder = (yargs) => {
    cli().args('ex', 'stop', yargs);
    yargs
        .option('a', {
            describe: 'add grafana annotation',
            default: false
        });
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    configChecks(cliConfig).returnConfigData();
    const tsuFunctions = _testFunctions || require('../lib/functions')(cliConfig);

    return tsuFunctions.stopEx()
        .catch(err => reply.fatal(err.message));
};
