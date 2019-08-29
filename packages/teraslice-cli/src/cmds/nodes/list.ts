import { ClusterState } from 'teraslice-client-js';
import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import TerasliceUtil from '../../helpers/teraslice-util';

import Reply from '../lib/reply';
import displayModule from '../lib/display';

const reply = new Reply();
const display = displayModule();
const yargsOptions = new YargsOptions();

export = {
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
        let response: ClusterState;
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
        }
        // @ts-ignore
        if (Object.keys(response).length === 0) {
            reply.fatal(`> No nodes on ${cliConfig.args.clusterAlias}`);
        }
        // @ts-ignore
        await display.display(header, response, format, active, parse);
    }
} as CMD;
