'use strict';

const reply = require('../lib/reply')();
const Config = require('../../lib/config');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'add <new_cluster_alias> <new_cluster_url>';
exports.desc = 'Add an alias to the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    yargs.positional('new_cluster_alias', yargsOptions.buildPositional('new_cluster_alias'));
    yargs.positional('new_cluster_url', yargsOptions.buildPositional('new_cluster_url'));
    yargs.options('config_dir', yargsOptions.buildOption('config_dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs
        .example('teraslice-cli aliases add cluster1 http://cluster1.net:80');
};

exports.handler = (argv) => {
    const cliConfig = new Config(argv);
    try {
        cliConfig.aliases.add(
            cliConfig.args.newClusterAlias,
            cliConfig.args.newClusterUrl
        );
    } catch (e) {
        reply.error(e);
    } finally {
        reply.green(
            `> Added ${cliConfig.args.newClusterAlias} host:${cliConfig.args.newClusterUrl}`
        );
        cliConfig.aliases.list();
    }
};
