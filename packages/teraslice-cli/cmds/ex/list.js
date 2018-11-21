'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'list <cluster_sh>';
exports.desc = 'List the executions ids with status of running and failing.\n';
exports.builder = (yargs) => {
    cli().args('ex', 'list', yargs);
    yargs
        .option('status', {
            alias: 's',
            describe: 'list of ex status to include',
            default: '*'
        });
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'ex:list').returnConfigData();
    const ex = _testFunctions || require('./lib')(cliConfig);

    return ex.list()
        .catch(err => reply.fatal(err.message));
};
