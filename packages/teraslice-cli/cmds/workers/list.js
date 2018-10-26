'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'list <cluster_sh>';
exports.desc = 'List the workers in a cluster\n';
exports.builder = (yargs) => {
    cli().args('worker', 'list', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'workers:list').returnConfigData();
    const workers = _testFunctions || require('./lib')(cliConfig);
    return workers.list()
        .catch(err => reply.fatal(err.message));
};
