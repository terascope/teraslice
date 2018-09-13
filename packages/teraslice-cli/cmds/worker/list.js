'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'list';
exports.desc = 'List the workers in a cluster\n';
exports.builder = (yargs) => {
    cli().args('worker', 'list', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'worker:list').returnConfigData();
    const worker = _testFunctions || require('./lib')(cliConfig);

    return worker.list()
        .catch(err => reply.fatal(err.message));
};
