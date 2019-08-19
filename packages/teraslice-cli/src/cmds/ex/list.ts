
import { CMD } from '../../interfaces';
import Config from '../../lib/config';
import TerasliceUtil from '../../lib/teraslice-util';
import YargsOptions from '../../lib/yargs-options';
import Reply from '../lib/reply';
import displayModule from '../lib/display';

const reply = new Reply();
const display = displayModule();
const yargsOptions = new YargsOptions();

export default {
    command: 'list <cluster-alias>',
    describe: 'List the executions ids on the teraslice cluster.\n',
    builder(yargs) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('ex-status'));
        // @ts-ignore
        yargs.strict()
            .example('$0 ex list cluster1')
            .example('$0 ex list cluster1 --status=failing');
        return yargs;
    },
    async handler(argv) {
        let response;
        const active = false;
        const parse = false;
        const cliConfig = new Config(argv);

        const teraslice = new TerasliceUtil(cliConfig);
        // @ts-ignore
        const format = `${cliConfig.args.output}Horizontal`;
        const header = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];

        try {
                // @ts-ignore

            response = await teraslice.client.ex.list(cliConfig.args.status);
        } catch (err) {
                    // @ts-ignore

            reply.fatal(`Error getting ex list on ${cliConfig.args.clusterAlias}\n${err}`);
        }
        // @ts-ignore

        const rows = await display.parseResponse(header, response, active);
        if (rows.length > 0) {
                    // @ts-ignore

            await display.display(header, rows, format, active, parse);
        } else {
                    // @ts-ignore

            reply.fatal(`> No ex_ids match status ${cliConfig.args.status}`);
        }
    }
} as CMD;
