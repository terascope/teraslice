'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'status';
exports.desc = 'List the ex status of running and failing job.\n';
exports.builder = (yargs) => {
    cli().args('ex', 'status', yargs);
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig).returnConfigData();
    const tsuFunctions = _testFunctions || require('../lib/functions')(cliConfig);

    return tsuFunctions.statusEx()
        .catch(err => reply.fatal(err.message));
};
