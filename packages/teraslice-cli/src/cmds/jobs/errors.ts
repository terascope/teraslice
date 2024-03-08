import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Jobs from '../../helpers/jobs.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'errors <cluster-alias> <job-id...>',
    describe: 'List errors for job or jobs on a cluster\n',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.strict()
            .example('$0 jobs errors CLUSTER_ALIAS JOB_ID1')
            .example('$0 jobs errors CLUSTER_ALIAS JOB_ID1 --from=500')
            .example('$0 jobs errors CLUSTER_ALIAS JOB_ID1 --size=10')
            .example('$0 jobs errors CLUSTER_ALIAS JOB_ID1 --sort=slicer_order:asc');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        try {
            await jobs.checkForErrors();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
