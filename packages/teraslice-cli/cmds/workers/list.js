'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'list <cluster_sh> [id]';
// TODO job_id, ex_id
exports.desc = 'List the workers in a cluster\n';
exports.builder = (yargs) => {
    cli().args('worker', 'list', yargs);
    yargs
        .example('teraslice-cli workers list cluster1')
        .example('teraslice-cli workers list http://cluster1.net:80')
        .example('teraslice-cli workers list cluster1 99999999-9999-9999-9999-999999999999');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'workers:list').returnConfigData();
    const workers = _testFunctions || require('./lib')(cliConfig);
    return workers.list()
        .catch(err => reply.fatal(err.message));
};
