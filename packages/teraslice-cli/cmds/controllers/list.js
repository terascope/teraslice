'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'list <cluster_sh>';
exports.desc = 'List controller(s) on a cluster.\n';
exports.builder = (yargs) => {
    cli().args('controllers', 'list', yargs);
    yargs.example('earl controllers list cluster1');
    yargs.example('earl controllers list http://cluster1.net:5678');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'controllers:list').returnConfigData();
    const controller = _testFunctions || require('./lib')(cliConfig);

    return controller.list()
        .catch(err => reply.fatal(err.message));
};
