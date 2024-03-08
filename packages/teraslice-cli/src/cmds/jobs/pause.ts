import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Jobs from '../../helpers/jobs.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'pause <cluster-alias>  <job-id...>',
    describe: 'Pause job or jobs on the specified cluster.\n',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('save', yargsOptions.buildOption('jobs-save'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.strict()
            .example('$0 jobs pause CLUSTER_ALIAS JOB_ID1', 'pauses job on the cluster')
            .example('$0 jobs pause CLUSTER_ALIAS JOB_ID1 JOB_ID2', 'pauses two jobs on the cluster')
            .example('$0 jobs pause CLUSTER_ALIAS all --status failed', 'pauses all failed jobs on the cluster');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        try {
            await jobs.pause();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
