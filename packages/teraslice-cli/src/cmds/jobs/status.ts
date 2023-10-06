import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Jobs from '../../helpers/jobs';
import reply from '../../helpers/reply';

const yargsOptions = new YargsOptions();

export = {
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
