
import { CMD } from '../../interfaces';
import Reply from '../lib/reply';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import _ from 'lodash';
import { getTerasliceClient } from '../../helpers/utils';

const reply = new Reply();
const yargsOptions = new YargsOptions();

export = {
    command: 'delete <cluster-alias> <asset-id>',
    describe: 'Delete asset from cluster.\n',
    builder(yargs) {
        yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
        yargs.positional('asset-id', yargsOptions.buildPositional('asset-id'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-ignore
        yargs.example('$0 assets delete ts-test1 ec2d5465609571590fdfe5b371ed7f98a04db5cb');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);
        const terasliceClient = getTerasliceClient(cliConfig);

        try {
            const resp = await terasliceClient.assets.delete(cliConfig.args.assetId);

            if (_.has(resp, 'error')) {
                        // @ts-ignore
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
    }
} as CMD;
