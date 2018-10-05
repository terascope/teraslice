// update existing cluster
// create new

'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'remove';
exports.desc = 'List the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    cli().args('alias', 'remove', yargs);
    yargs
        .demandCommand(1);
    yargs.example('earl alias remove cluster1');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'alias:remove').returnConfigData(false, false);
    const libAlias = _testFunctions || require('./lib')(cliConfig);

    return libAlias.remove()
        .catch(err => reply.fatal(err.message));
};
