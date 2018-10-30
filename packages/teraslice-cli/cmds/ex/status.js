'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'status <cluster_sh>';
exports.desc = 'List the ex status of running and failing job.\n';
exports.builder = (yargs) => {
    cli().args('ex', 'status', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'ex:status').returnConfigData();
    const exLib = _testFunctions || require('./lib')(cliConfig);

    return exLib.status()
        .catch(err => reply.fatal(err.message));
};
