import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Jobs from '../../helpers/jobs.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'status <cluster-alias> <job-id...>',
    describe: 'Lists a job or jobs current status.\n',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.strict()
            .example('$0 jobs status CLUSTER_ALIAS JOB_ID', 'shows job\'s current status')
            .example('$0 jobs status CLUSTER_ALIAS JOB_ID JOB_ID', 'shows two jobs\' current status')
            .example('$0 jobs status CLUSTER_ALIAS all', 'shows all active jobs (running or failing)\' status on a cluster');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        try {
            await jobs.checkStatus();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
