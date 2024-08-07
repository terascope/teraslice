import { Teraslice } from '@terascope/types';
import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import TerasliceUtil from '../../helpers/teraslice-util.js';
import reply from '../../helpers/reply.js';
import Display from '../../helpers/display.js';

const display = new Display();
const yargsOptions = new YargsOptions();

export default {
    command: 'list <cluster-alias>',
    describe: 'List the jobs on the cluster. Defaults to 10 jobs.',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('deleted', yargsOptions.buildOption('show-deleted'));
        yargs.options('active', yargsOptions.buildOption('active-job'));
        yargs.strict()
            .example('$0 jobs list CLUSTER_ALIAS')
            .example('$0 jobs list CLUSTER_ALIAS --deleted include', 'Show all jobs in cluster, including deleted')
            .example('$0 jobs list CLUSTER_ALIAS --active true', 'Show only active jobs in cluster');
        return yargs;
    },
    async handler(argv: any) {
        let response: Teraslice.JobConfigParams[];
        const displayActive = false;
        const parse = true;
        const cliConfig = new Config(argv);
        const {
            active, clusterAlias, deleted, output
        } = cliConfig.args;
        const teraslice = new TerasliceUtil(cliConfig);
        const header = ['job_id', 'name', 'lifecycle', 'slicers', 'workers', '_created', '_updated'];
        const format = `${output}Horizontal`;
        if (deleted !== 'exclude') {
            header.push('_deleted');
        }

        try {
            response = await teraslice.client.jobs.list({ active, deleted });
        } catch (err) {
            reply.fatal(`Error getting jobs list on ${clusterAlias}\n${err}`);
        }
        // @ts-expect-error
        if (response.length === 0) {
            reply.fatal(`> No jobs on ${clusterAlias} match with "deleted: ${deleted}" and "active: ${active}"`);
        }
        // @ts-expect-error
        await display.display(header, response, format, displayActive, parse);
    }
} as CMD;
