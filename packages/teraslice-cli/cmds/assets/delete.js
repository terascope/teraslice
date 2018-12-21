'use strict';
'use console';

const _ = require('lodash');

const Config = require('../../lib/config');
const reply = require('../lib/reply')();
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'delete <cluster-alias> <asset-id>';
exports.desc = 'Delete asset from cluster.\n';
exports.builder = (yargs) => {
    yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
    yargs.positional('asset-id', yargsOptions.buildPositional('asset-id'));
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 assets delete ts-test1 ec2d5465609571590fdfe5b371ed7f98a04db5cb');
};

exports.handler = async (argv) => {
    const cliConfig = new Config(argv);

    try {
        const resp = JSON.parse(
            await cliConfig.terasliceClient.assets.delete(cliConfig.args.assetId)
        );

        if (_.has(resp, 'error')) {
            reply.yellow(`WARNING: Error (${_.get(resp, 'error')}): ${_.get(resp, 'message')}`);
        }
    } catch (err) {
        reply.fatal(`Error deleting assets on ${cliConfig.args.clusterAlias}: ${err}`);
    }
    reply.green(`Asset ${cliConfig.args.assetId} deleted from ${cliConfig.args.clusterAlias}`);
};
