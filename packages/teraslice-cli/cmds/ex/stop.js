'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const configChecks = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'stop <cluster_sh>';
exports.desc = 'stops ex that is running or failing on the cluster.\n';
exports.builder = (yargs) => {
    cli().args('ex', 'stop', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    configChecks(cliConfig).returnConfigData();
    const tsuFunctions = _testFunctions || require('./lib')(cliConfig);

    return tsuFunctions.stop()
        .catch(err => reply.fatal(err.message));
};
