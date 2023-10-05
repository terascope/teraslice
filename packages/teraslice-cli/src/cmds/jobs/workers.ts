import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import reply from '../../helpers/reply';
import Jobs from '../../helpers/jobs';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'workers <cluster-alias> <action> <number> <job-id...>',
    describe: 'Manage workers for a job or multiple jobs\n',
    builder(yargs: any) {
        yargs.positional('action', yargsOptions.buildPositional('worker-action'));
        yargs.positional('number', yargsOptions.buildPositional('worker-number'));
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.strict()
            .example('$0 jobs workers CLUSTER_ALIAS add 5 JOB_ID', 'adds five workers to a job')
            .example('$0 jobs workers CLUSTER_ALIAS remove 5 JOB_ID', 'removes five workers from a job')
            .example('$0 jobs workers CLUSTER_ALIAS total 10 JOB_ID', 'sets worker count to 10 for a job')
            .example('$0 jobs workers CLUSTER_ALIAS remove 5 JOB_ID1 JOB_ID2 JOB_ID3', 'removes 5 workers from 3 jobs')
            .example('$0 jobs workers CLUSTER_ALIAS remove 5 JOB_ID1 --status failing', 'removes 5 workers from jobs with status failing')
            .example('$0 jobs workers CLUSTER_ALIAS remove 5 all', 'removes 5 workers from all jobs running on the cluster');
        return yargs;
    },
    async handler(argv: any): Promise <void> {
        const cliConfig = new Config(argv);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        try {
            await jobs.adjustWorkers();
        } catch (e) {
            reply.fatal(e);
        }
    }
};

export = cmd;
