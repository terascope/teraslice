import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Jobs from '../../helpers/jobs';
import reply from '../../helpers/reply';

const yargsOptions = new YargsOptions();

export = {
    command: 'run <cluster-alias> <job-id...>',
    describe: 'run job specified by id \n',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('save', yargsOptions.buildOption('jobs-save'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.options('watch', yargsOptions.buildOption('jobs-watch'));
        yargs.strict()
            .example('$0 jobs run CLUSTER_ALIAS JOB_ID', 'starts job on cluster')
            .example('$0 jobs run CLUSTER_ALIAS JOB_ID1 JOB_ID2 JOB_ID3', 'starts multiple jobs on a cluster')
            .example('$0 jobs run CLUSTER_ALIAS all', 'starts all jobs on a cluster from the state file');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);

        const jobs = new Jobs(cliConfig);
        await jobs.initialize();

        try {
            await jobs.run();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
