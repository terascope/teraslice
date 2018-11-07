'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'list <cluster_sh>';
exports.desc = 'List assets on a cluster.\n';
exports.builder = (yargs) => {
    cli().args('assets', 'list', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'assets:list').returnConfigData();
    const assets = _testFunctions || require('./lib')(cliConfig);

    return assets.list()
        .catch(err => reply.fatal(err.message));
};
