import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import displayModule from '../lib/display';
import TerasliceUtil from '../../helpers/teraslice-util';
import YargsOptions from '../../helpers/yargs-options';
import Reply from '../lib/reply';

const reply = new Reply();

const yargsOptions = new YargsOptions();
const display = displayModule();

export = {
    command: 'list <cluster-alias>',
    describe: 'List controller(s) on a cluster.\n',
    builder(yargs) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        // @ts-ignore
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
