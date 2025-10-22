import { has } from '@terascope/core-utils';
import { CMD } from '../../interfaces.js';
import reply from '../../helpers/reply.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import { getTerasliceClient } from '../../helpers/utils.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'delete <cluster-alias> <asset-id>',
    describe: 'Delete asset from cluster.\n',
    builder(yargs) {
        yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
        yargs.positional('asset-id', yargsOptions.buildPositional('asset-id'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-expect-error
        yargs.example('$0 assets delete ts-test1 ec2d5465609571590fdfe5b371ed7f98a04db5cb');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);
        const terasliceClient = getTerasliceClient(cliConfig);

        try {
            const resp = await terasliceClient.assets.remove(cliConfig.args.assetId);

            if (has(resp, 'error')) {
                // @ts-expect-error
                reply.yellow(`WARNING: Error (${resp.error}): ${resp.message}`);
            } else {
                reply.green(`Asset ${cliConfig.args.assetId} deleted from ${cliConfig.args.clusterAlias}`);
            }
        } catch (err) {
            if (err.message.includes('Unable to find asset')) {
                reply.green(`Asset ${cliConfig.args.assetId} not found on ${cliConfig.args.clusterAlias}`);
            } else {
                reply.fatal(`Error deleting assets on ${cliConfig.args.clusterAlias}: ${err.message}`);
            }
        }
    }
} as CMD;
