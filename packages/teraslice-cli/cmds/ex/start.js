'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const configChecks = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'start';
exports.desc = 'starts all job on the specified in the saved state file \n';
exports.builder = (yargs) => {
    cli().args('ex', 'start', yargs);
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

    return tsuFunctions.startExIds()
        .catch(err => reply.fatal(err.message));
};
