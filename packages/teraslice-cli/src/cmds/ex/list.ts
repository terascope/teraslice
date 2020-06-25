import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import TerasliceUtil from '../../helpers/teraslice-util';
import YargsOptions from '../../helpers/yargs-options';
import reply from '../lib/reply';
import Display from '../lib/display';

const display = new Display();
const yargsOptions = new YargsOptions();

export = {
    command: 'list <cluster-alias>',
    describe: 'List the executions ids on the teraslice cluster.\n',
    builder(yargs) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('ex-status'));
        yargs.strict()
            .example('$0 ex list cluster1', '')
            .example('$0 ex list cluster1 --status=failing', '');
        return yargs;
    },
    async handler(argv) {
        let response;
        const active = false;
        const parse = false;
        const cliConfig = new Config(argv);

        const teraslice = new TerasliceUtil(cliConfig);
        const format = `${cliConfig.args.output}Horizontal`;
        const header = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];

        try {
            response = await teraslice.client.executions.list(cliConfig.args.status);
        } catch (err) {
            reply.fatal(`Error getting ex list on ${cliConfig.args.clusterAlias}\n${err}`);
        }

        const rows = await display.parseResponse(header, response ?? [], active);
        if (rows.length > 0) {
            await display.display(header, rows, format, active, parse);
        } else {
            reply.fatal(`> No ex_ids match status ${cliConfig.args.status}`);
        }
    }
} as CMD;
