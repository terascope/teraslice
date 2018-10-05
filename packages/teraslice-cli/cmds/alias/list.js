'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'list';
exports.desc = 'List the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    cli().args('alias', 'list', yargs);
    yargs.example('earl alias list cluster1');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'alias:list').returnConfigData(false);
    const libAlias = _testFunctions || require('./lib')(cliConfig);

    return libAlias.list()
        .catch(err => reply.fatal(err.message));
};
