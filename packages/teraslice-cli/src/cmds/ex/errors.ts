
import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import TerasliceUtil from '../../helpers/teraslice-util';
import YargsOptions from '../../helpers/yargs-options';
import Reply from '../lib/reply';
import displayModule from '../lib/display';

const reply = new Reply();
const display = displayModule();
const yargsOptions = new YargsOptions();

export = {
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
        const format = `${cliConfig.args.output}Horizontal`;

        try {
            const opts: any = {};
            opts.from = cliConfig.args.from;
            opts.sort = cliConfig.args.sort;
            opts.size = cliConfig.args.size;
            response = await teraslice.client.ex.errors(cliConfig.args.id, opts);
        } catch (err) {
            reply.fatal(`Error getting ex errors list on ${cliConfig.args.clusterAlias}\n${err}`);
        }

        const rows = await display.parseResponse(header, response, active);
        if (rows.length > 0) {
            await display.display(header, rows, format, active, parse);
        } else {
            reply.fatal(`> No errors for ex_id: ${cliConfig.args.id}`);
        }
    }
} as CMD;
