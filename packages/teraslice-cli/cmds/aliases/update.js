'use strict';

const reply = require('../lib/reply')();
const Config = require('../../lib/config');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'update <cluster-alias> <new-cluster-url>';
exports.desc = 'Update an alias to the clusters defined in the config file.\n';
exports.builder = (yargs) => {
    yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
    yargs.positional('new-cluster-url', yargsOptions.buildPositional('new-cluster-url'));
    yargs.coerce('new-cluster-url', yargsOptions.buildCoerce('new-cluster-url'));
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.options('list', yargsOptions.buildOption('list'));
    yargs
        .example('$0 aliases update cluster1 http://cluster1.net:80');
};

exports.handler = (argv) => {
    const cliConfig = new Config(argv);

    try {
        cliConfig.aliases.update(
            cliConfig.args.clusterAlias,
            cliConfig.args.newClusterUrl
        );
        if (cliConfig.args.list) {
            cliConfig.aliases.list(cliConfig.args.output);
        }
        reply.green(`> Updated alias ${cliConfig.args.clusterAlias} host: ${cliConfig.args.newClusterUrl}`);
    } catch (e) {
        reply.error(`error updating alias ${e}`);
    }
};
