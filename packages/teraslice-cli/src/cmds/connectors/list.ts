import { Teraslice } from '@terascope/types';
import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import TerasliceUtil from '../../helpers/teraslice-util.js';
import reply from '../../helpers/reply.js';
import Display from '../../helpers/display.js';

const display = new Display();
const yargsOptions = new YargsOptions();

export default {
    command: 'list <cluster-alias>',
    describe: 'List the connectors configured on a cluster.\n',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.option('type', {
            describe: 'Only list connectors of this type, e.g. kafka',
            type: 'string'
        });
        yargs.option('name', {
            describe: 'Only list connectors with this connection name, e.g. default',
            type: 'string'
        });
        yargs.strict()
            .example('$0 connectors list cluster1', '')
            .example('$0 connectors list cluster1 --type kafka', '');
        return yargs;
    },
    async handler(argv: any) {
        let response: Teraslice.ConnectorListResponse;
        const active = false;
        const parse = true;
        const cliConfig = new Config(argv);
        const teraslice = new TerasliceUtil(cliConfig);

        const header = ['type', 'name', 'is_state_cluster', 'is_asset_store'];
        const format = `${cliConfig.args.output}Horizontal`;

        try {
            response = await teraslice.client.cluster.connectors({
                type: cliConfig.args.type,
                name: cliConfig.args.name
            });
        } catch (err) {
            reply.fatal(`Error getting cluster connectors on ${cliConfig.args.clusterAlias}\n${err}`);
            return;
        }

        const { connectors } = response;

        if (!Array.isArray(connectors) || connectors.length === 0) {
            reply.fatal(`> No connectors on ${cliConfig.args.clusterAlias}`);
            return;
        }

        await display.display(header, connectors, format, active, parse);
    }
} as CMD;
