
import { CMD } from '../../interfaces';
import Config from '../../lib/config';
import displayModule from '../lib/display';
import TerasliceUtil from  '../../lib/teraslice-util';
import YargsOptions from '../../lib/yargs-options';

const yargsOptions = new YargsOptions();
const display = displayModule();

export default {
    command: 'list <cluster-alias>',
    describe: 'List controller(s) on a cluster.\n',
    builder(yargs) {
        // @ts-ignore
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-ignore
        yargs.options('output', yargsOptions.buildOption('output'));
        // @ts-ignore
        yargs.strict().example('$0 controllers list cluster1');
        return yargs;
    },
    async handler (argv) {
        let response;
        const parse = true;
        const active = false;
        const cliConfig = new Config(argv);
        const teraslice = new TerasliceUtil(cliConfig);

        const header = ['name', 'job_id', 'workers_available', 'workers_active', 'failed', 'queued', 'processed'];
        // @ts-ignore
        const format = `${cliConfig.args.output}Horizontal`;

        // older versions of teraslice do not have contollers end point
        try {
            response = await teraslice.client.cluster.controllers();
        } catch (e) {
            response = await teraslice.client.cluster.slicers();
        }
        if (Object.keys(response).length === 0) {
            // @ts-ignore
            reply.fatal(`> No controllers on ${cliConfig.args.clusterAlias}`);
        }
// @ts-ignore
        await display.display(header, response, format, active, parse);
    }
} as CMD;
