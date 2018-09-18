// update existing cluster
// create new

'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'alias';
exports.desc = 'List the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    cli().args('cluster', 'alias', yargs);
    yargs
        .option('port', {
            alias: 'p',
            describe: 'port',
            default: 5678
        })
        .option('remove', {
            alias: 'r',
            describe: 'remove cluster from config',
            default: false
        })
        .option('env', {
            alias: 'e',
            describe: 'environment',
            default: 'local'
        });
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'cluster:alias').returnConfigData(false, false);
    const libCluster = _testFunctions || require('./lib')(cliConfig);

    return libCluster.alias()
        .catch(err => reply.fatal(err.message));
};
