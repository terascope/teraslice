import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Jobs from '../../helpers/jobs';
import reply from '../../helpers/reply';

const yargsOptions = new YargsOptions();

export = {
    command: 'resume <cluster-alias> <job-id...>',
    describe: 'Resume job(s) on cluster.  They must be in the paused state\n',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('save', yargsOptions.buildOption('jobs-save'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.options('timeout', yargsOptions.buildOption('timeout'));
        yargs.options('interval', yargsOptions.buildOption('interval'));
        yargs.options('watch', yargsOptions.buildOption('jobs-watch'));
        yargs.strict()
            .example('$0 jobs resume CLUSTER_ALIAS JOB_ID1', 'resumes job on the cluster')
            .example('$0 jobs resume CLUSTER_ALIAS JOB_ID1 JOB_ID2', 'resumes two jobs on the cluster')
            .example('$0 jobs resume CLUSTER_ALIAS all', 'resumes all jobs on the cluster');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        try {
            await jobs.resume();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
