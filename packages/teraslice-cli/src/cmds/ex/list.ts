import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import TerasliceUtil from '../../helpers/teraslice-util.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';
import Display from '../../helpers/display.js';

const display = new Display();
const yargsOptions = new YargsOptions();

export default {
    command: 'list <cluster-alias>',
    describe: 'List the executions ids on the teraslice cluster.\n',
    builder(yargs) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('ex-status'));
        yargs.options('deleted', yargsOptions.buildOption('show-deleted'));
        yargs.strict()
            .example('$0 ex list cluster1', 'Show executions in a cluster')
            .example('$0 ex list cluster1 --status=failing', 'Show all executions in cluster with a status of failing')
            .example('$0 ex list cluster1 --deleted=include', 'Show all executions in cluster, including deleted');
        return yargs;
    },
    async handler(argv) {
        let response;
        const active = false;
        const parse = false;
        const cliConfig = new Config(argv);
        const {
            clusterAlias, deleted, output, status
        } = cliConfig.args;

        const teraslice = new TerasliceUtil(cliConfig);
        const format = `${output}Horizontal`;
        const header = ['name', 'lifecycle', 'slicers', 'workers', '_status', 'ex_id', 'job_id', '_created', '_updated'];
        if (deleted !== 'exclude') {
            header.push('_deleted_on');
        }

        try {
            response = await teraslice.client.executions.list({ status, deleted });
        } catch (err) {
            reply.fatal(`Error getting ex list on ${clusterAlias}\n${err}`);
        }

        const rows = await display.parseResponse(header, response ?? [], active);
        if (rows.length > 0) {
            await display.display(header, rows, format, active, parse);
        } else {
            reply.fatal(`> No ex_ids match "status: ${status !== '' ? status : '*'}" and "deleted: ${deleted}"`);
        }
    }
} as CMD;
