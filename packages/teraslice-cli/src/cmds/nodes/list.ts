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
    describe: 'List the nodes of a cluster.\n',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.strict()
            .example('$0 nodes list cluster1');
        return yargs;
    },
    async handler(argv: any) {
        let response: Teraslice.ClusterState;
        const active = false;
        const parse = true;
        const cliConfig = new Config(argv);
        const teraslice = new TerasliceUtil(cliConfig);

        const header = ['node_id', 'state', 'hostname', 'active', 'teraslice_version', 'node_version'];
        const format = `${cliConfig.args.output}Horizontal`;

        try {
            response = await teraslice.client.cluster.state();
        } catch (err) {
            reply.fatal(`Error getting cluster state on ${cliConfig.args.clusterAlias}\n${err}`);
            return;
        }

        if (Object.keys(response).length === 0) {
            reply.fatal(`> No nodes on ${cliConfig.args.clusterAlias}`);
            return;
        }

        await display.display(header, response, format, active, parse);
    }
} as CMD;
