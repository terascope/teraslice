'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'list';
exports.desc = 'List the nodes of a cluster.\n';
exports.builder = (yargs) => {
    cli().args('node', 'list', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'node:list').returnConfigData();
    const node = _testFunctions || require('./lib')(cliConfig);
    return node.list()
        .catch(err => reply.fatal(err.message));
};
