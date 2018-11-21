// update existing cluster
// create new

'use strict';
'use console';

const _ = require('lodash');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'remove  <cluster_sh>';
exports.desc = 'List the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    cli().args('aliases', 'remove', yargs);
    yargs.example('teraslice-cli aliases remove cluster1');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'aliases:remove').returnConfigData(false, false);
    const libAliases = _testFunctions || require('./lib')(cliConfig);

    return libAliases.remove()
        .catch(err => reply.fatal(err.message));
};
