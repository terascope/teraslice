'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'stats <cluster_sh>';
exports.desc = 'Show stats of the controller(s) on a cluster.\n';
exports.builder = (yargs) => {
    cli().args('controller', 'stats', yargs);
    yargs.example('earl controller stats cluster1');
    yargs.example('earl controller stats http://cluster1.net:5678');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'controllers:stats').returnConfigData();
    const controller = _testFunctions || require('./lib')(cliConfig);

    return controller.stats()
        .catch(err => reply.fatal(err.message));
};
