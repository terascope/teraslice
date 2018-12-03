'use strict';

const reply = require('../lib/reply')();
const Config = require('../../lib/config');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'update <cluster_alias> <new_cluster_url>';
exports.desc = 'Update an alias to the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    yargs.positional('cluster_alias', yargsOptions.buildPositional('cluster_alias'));
    yargs.positional('new_cluster_url', yargsOptions.buildPositional('new_cluster_url'));
    yargs.options('config_dir', yargsOptions.buildOption('config_dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs
        .example('teraslice-cli aliases update cluster1 http://cluster1.net:80');
};

exports.handler = (argv) => {
    const cliConfig = new Config(argv);

    try {
        cliConfig.aliases.update(
            cliConfig.args.clusterAlias,
            cliConfig.args.newClusterUrl
        );
    } catch (e) {
        reply.error(e);
    } finally {
        reply.green(`> Updated ${cliConfig.args.clusterAlias} host:${cliConfig.args.newClusterUrl}`);
    }
};
