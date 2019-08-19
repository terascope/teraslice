
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
    command: 'errors <cluster-alias> <id>',
    describe: 'Get the status of an execution id.\n',
    builder(yargs) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('from', yargsOptions.buildOption('ex-from'));
        yargs.options('size', yargsOptions.buildOption('ex-size'));
        yargs.options('sort', yargsOptions.buildOption('ex-sort'));
        // @ts-ignore
        yargs.strict()
            .example('$0 ex errors cluster1 99999999-9999-9999-9999-999999999999')
            .example('$0 ex errors cluster1 99999999-9999-9999-9999-999999999999 --from=500')
            .example('$0 ex errors cluster1 99999999-9999-9999-9999-999999999999 --size=10')
            .example('$0 ex errors cluster1 99999999-9999-9999-9999-999999999999 --sort=slicer_order:asc');
        return yargs;
    },
    async handler(argv) {
        let response;
        const active = false;
        const parse = false;
        const cliConfig = new Config(argv);
        const teraslice = new TerasliceUtil(cliConfig);
        const header = ['ex_id', 'slice_id', 'slicer_id', 'slicer_order', 'state', '_created', '_updated', 'error'];
         // @ts-ignore
        const format = `${cliConfig.args.output}Horizontal`;

        try {
            const opts: any = {};
            // @ts-ignore
            opts.from = cliConfig.args.from;
             // @ts-ignore
            opts.sort = cliConfig.args.sort;
             // @ts-ignore
            opts.size = cliConfig.args.size;
             // @ts-ignore
            response = await teraslice.client.ex.errors(cliConfig.args.id, opts);
        } catch (err) {
                    // @ts-ignore

            reply.fatal(`Error getting ex errors list on ${cliConfig.args.clusterAlias}\n${err}`);
        }
        // @ts-ignore
        const rows = await display.parseResponse(header, response, active);
        if (rows.length > 0) {
                    // @ts-ignore
            await display.display(header, rows, format, active, parse);
        } else {
             // @ts-ignore
            reply.fatal(`> No errors for ex_id: ${cliConfig.args.id}`);
        }
    }
} as CMD;
