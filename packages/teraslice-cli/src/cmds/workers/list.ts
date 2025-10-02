import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import TerasliceUtil from '../../helpers/teraslice-util.js';

import reply from '../../helpers/reply.js';
import Display from '../../helpers/display.js';

const display = new Display();
const yargsOptions = new YargsOptions();

export default {
    command: 'list <cluster-alias> [id]',
    describe: 'List the workers in a cluster\n',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.strict()
            .example('$0 workers list cluster1')
            .example('$0 workers list cluster1 99999999-9999-9999-9999-999999999999');
        return yargs;
    },
    async handler(argv: any) {
        let response;
        const active = true;
        const parse = false;
        const cliConfig = new Config(argv);
        const teraslice = new TerasliceUtil(cliConfig);

        let header = ['assignment', 'job_id', 'ex_id', 'node_id', 'pid'];
        const format = `${cliConfig.args.output}Horizontal`;

        const clusterType = await teraslice.type();
        if (clusterType === 'kubernetesV2') {
            // total and pid are n/a with kubernetes, so they are removed from the output
            header = ['assignment', 'job_id', 'ex_id', 'node_id', 'worker_id', 'teraslice_version'];
        }

        try {
            response = await teraslice.client.cluster.state();
        } catch (err) {
            reply.fatal(`Error getting cluster state on ${cliConfig.args.clusterAlias}\n${err}`);
        }
        // @ts-expect-error
        if (Object.keys(response).length === 0) {
            reply.fatal(`> No workers on ${cliConfig.args.clusterAlias}`);
        }

        // check if id is in response
        const rows = await display.parseResponse(header, response ?? [], active, cliConfig.args.id);
        if (rows.length > 0) {
            await display.display(header, rows, format, active, parse, cliConfig.args.id);
        } else {
            reply.fatal(`> No workers match id ${cliConfig.args.id}`);
        }
    }
} as CMD;
