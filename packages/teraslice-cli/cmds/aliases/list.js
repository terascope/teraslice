'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'list';
exports.desc = 'List the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    cli().args('aliases', 'list', yargs);
    yargs.strict()
        .example('earl aliases list cluster1');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'aliases:list').returnConfigData(false);
    const libAliases = _testFunctions || require('./lib')(cliConfig);

    return libAliases.list()
        .catch(err => reply.fatal(err.message));
};
