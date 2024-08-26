import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Jobs from '../../helpers/jobs.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'delete <cluster-alias> <job-id...>',
    describe: 'Delete jobs from the teraslice cluster. Jobs must be in a terminal state.',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.strict()
            .example('$0 jobs delete CLUSTER_ALIAS JOB_ID', 'deletes job on a cluster')
            .example('$0 jobs delete CLUSTER_ALIAS JOB_ID1 JOB_ID2', 'deletes multiple jobs on a cluster')
            .example('$0 jobs delete CLUSTER_ALIAS all', 'deletes all jobs on a cluster from the state file');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        try {
            await jobs.delete();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
