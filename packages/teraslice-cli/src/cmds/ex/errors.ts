import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import TerasliceUtil from '../../helpers/teraslice-util.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';
import Display from '../../helpers/display.js';

const display = new Display();
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
        yargs.strict()
            .example('$0 ex errors cluster1 99999999-9999-9999-9999-999999999999', '')
            .example('$0 ex errors cluster1 99999999-9999-9999-9999-999999999999 --from=500', '')
            .example('$0 ex errors cluster1 99999999-9999-9999-9999-999999999999 --size=10', '')
            .example('$0 ex errors cluster1 99999999-9999-9999-9999-999999999999 --sort=slicer_order:asc', '');
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
            response = await teraslice.client.executions.wrap(cliConfig.args.id).errors(opts);
        } catch (err) {
            reply.fatal(`Error getting ex errors list on ${cliConfig.args.clusterAlias}\n${err}`);
        }

        const rows = await display.parseResponse(header, response ?? [], active);
        if (rows.length > 0) {
            await display.display(header, rows, format, active, parse);
        } else {
            reply.fatal(`> No errors for ex_id: ${cliConfig.args.id}`);
        }
    }
} as CMD;
