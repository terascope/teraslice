'use strict';

const reply = require('../lib/reply')();
const TerasliceCliConfig = require('../lib/teraslice-cli-config');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'remove  <cluster_alias>';
exports.desc = 'List the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    yargs.positional('cluster_alias', yargsOptions.buildPositional('cluster_alias'));
    yargs.options('config_dir', yargsOptions.buildOption('config_dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.example('teraslice-cli aliases remove cluster1');
};

exports.handler = (argv, _testFunctions) => {
    const cliConfig = new TerasliceCliConfig(argv);
    const libAliases = _testFunctions || require('./lib')(cliConfig);

    return libAliases.remove()
        .catch(err => reply.fatal(err.message));
};
