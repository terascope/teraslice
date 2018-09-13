'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'stats';
exports.desc = 'Show stats of the controller(s) on a cluster.\n';
exports.builder = (yargs) => {
    cli().args('controller', 'stats', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'controller:stats').returnConfigData();
    const controller = _testFunctions || require('./lib')(cliConfig);

    return controller.stats()
        .catch(err => reply.fatal(err.message));
};
