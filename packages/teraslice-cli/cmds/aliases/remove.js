'use strict';

const reply = require('../lib/reply')();
const Config = require('../../lib/config');
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

exports.handler = (argv) => {
    const cliConfig = new Config(argv);

    try {
        cliConfig.aliases.remove(cliConfig.args.clusterAlias);
        reply.green(`> Removed ${cliConfig.args.clusterAlias}`);
    } catch (e) {
        reply.error(e);
    }
};
