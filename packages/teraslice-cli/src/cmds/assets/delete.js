'use strict';
'use console';

const _ = require('lodash');

const Config = require('../../lib/config');
const { getTerasliceClient } = require('../../lib/utils');
const reply = require('../lib/reply')();
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'delete <cluster-alias> <asset-id>';
exports.desc = 'Delete asset from cluster.\n';
exports.builder = (yargs) => {
    yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
    yargs.positional('asset-id', yargsOptions.buildPositional('asset-id'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 assets delete ts-test1 ec2d5465609571590fdfe5b371ed7f98a04db5cb');
};

exports.handler = async (argv) => {
    const cliConfig = new Config(argv);
    const terasliceClient = getTerasliceClient(cliConfig);

    try {
        const resp = await terasliceClient.assets.delete(cliConfig.args.assetId);

        if (_.has(resp, 'error')) {
            reply.yellow(`WARNING: Error (${resp.error}): ${resp.message}`);
        } else {
            reply.green(`Asset ${cliConfig.args.assetId} deleted from ${cliConfig.args.clusterAlias}`);
        }
    } catch (err) {
        if (err.message.includes('Unable to find asset')) {
            reply.green(`Asset ${cliConfig.args.assetId} not found on ${cliConfig.args.clusterAlias}`);
        } else {
            reply.fatal(`Error deleting assets on ${cliConfig.args.clusterAlias}: ${err}`);
        }
    }
};
