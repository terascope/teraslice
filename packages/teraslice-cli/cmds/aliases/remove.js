'use strict';

const reply = require('../lib/reply')();
const Config = require('../../lib/config');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'remove  <cluster-alias>';
exports.desc = 'List the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.options('list', yargsOptions.buildOption('list'));
    yargs.example('$0 aliases remove cluster1');
};

exports.handler = (argv) => {
    const cliConfig = new Config(argv);

    try {
        cliConfig.aliases.remove(cliConfig.args.clusterAlias);
        if (cliConfig.args.list) {
            cliConfig.aliases.list(cliConfig.args.output);
        }
        reply.green(`> Removed alias ${cliConfig.args.clusterAlias}`);
    } catch (e) {
        reply.error(`error removing alias ${e}`);
    }
};
