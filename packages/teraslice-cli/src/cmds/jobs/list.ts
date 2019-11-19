import { JobConfiguration } from 'teraslice-client-js';
import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import TerasliceUtil from '../../helpers/teraslice-util';
import Reply from '../lib/reply';
import displayModule from '../lib/display';

const reply = new Reply();
const display = displayModule();
const yargsOptions = new YargsOptions();

export = {
    command: 'list <cluster-alias>',
    describe: 'List the jobs on the cluster. Defaults to 10 jobs.',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.strict()
            .example('$0 jobs list cluster1');
        return yargs;
    },
    async handler(argv: any) {
        let response: JobConfiguration[];
        const active = false;
        const parse = true;
        const cliConfig = new Config(argv);
        const teraslice = new TerasliceUtil(cliConfig);
        const header = ['job_id', 'name', 'lifecycle', 'slicers', 'workers', '_created', '_updated'];
        const format = `${cliConfig.args.output}Horizontal`;

        try {
            response = await teraslice.client.jobs.list();
        } catch (err) {
            reply.fatal(`Error getting jobs list on ${cliConfig.args.clusterAlias}\n${err}`);
        }
        // @ts-ignore
        if (response.length === 0) {
            reply.fatal(`> No jobs on ${cliConfig.args.clusterAlias}`);
        }
        // @ts-ignore
        await display.display(header, response, format, active, parse);
    }
} as CMD;
