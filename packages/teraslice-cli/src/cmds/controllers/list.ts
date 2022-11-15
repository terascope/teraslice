import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import Display from '../../helpers/display.js';
import TerasliceUtil from '../../helpers/teraslice-util.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();
const display = new Display();

export default {
    command: 'list <cluster-alias>',
    describe: 'List controller(s) on a cluster.\n',
    builder(yargs) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        // @ts-expect-error
        yargs.strict().example('$0 controllers list cluster1');
        return yargs;
    },
    async handler(argv) {
        let response;
        const parse = true;
        const active = false;
        const cliConfig = new Config(argv);
        const teraslice = new TerasliceUtil(cliConfig);

        const header = ['name', 'job_id', 'workers_available', 'workers_active', 'failed', 'queued', 'processed'];
        const format = `${cliConfig.args.output}Horizontal`;

        // older versions of teraslice do not have contollers end point
        try {
            response = await teraslice.client.cluster.controllers();
        } catch (e) {
            response = await teraslice.client.cluster.slicers();
        }

        if (Object.keys(response).length === 0) {
            reply.fatal(`> No controllers on ${cliConfig.args.clusterAlias}`);
        }
        await display.display(header, response, format, active, parse);
    }
} as CMD;
