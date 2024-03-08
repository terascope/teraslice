import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Jobs from '../../helpers/jobs.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'restart <cluster-alias> <job-id...>',
    describe: 'Restart job id on the specified cluster.\n',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('timeout', yargsOptions.buildOption('timeout'));
        yargs.options('interval', yargsOptions.buildOption('interval'));
        yargs.options('watch', yargsOptions.buildOption('jobs-watch'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.strict()
            .example('$0 jobs restart CLUSTER_ALIAS JOB_ID', 'restarts job on the cluster')
            .example('$0 jobs restart CLUSTER_ALIAS JOB_ID1 JOB_ID2', 'restarts two jobs on the cluster')
            .example('$0 jobs restart CLUSTER_ALIAS JOB_ID1 --watch 100', 'restarts a job on the cluster and watches for 100 slices')
            .example('$0 jobs restart CLUSTER_ALIAS all --status failing', 'restarts all failing jobs on the cluster')
            .example('$0 jobs restart CLUSTER_ALIAS all', 'restarts all jobs on the cluster');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        try {
            await jobs.restart();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
