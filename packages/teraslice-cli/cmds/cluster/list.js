'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'list';
exports.desc = 'List the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    cli().args('cluster', 'list', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'cluster:list').returnConfigData(false);
    const libCluster = _testFunctions || require('./lib')(cliConfig);

    return libCluster.list()
        .catch(err => reply.fatal(err.message));
};

