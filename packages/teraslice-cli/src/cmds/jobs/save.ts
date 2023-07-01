import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Jobs from '../../helpers/jobs';
import reply from '../../helpers/reply';

const yargsOptions = new YargsOptions();

export = {
    command: 'save <cluster-alias> <job-id...>',
    describe: 'Saves job or jobs on a cluster to a json file.The file is saved in the .teraslice dir\n',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.strict()
            .example('$0 jobs save CLUSTER_ALIAS JOB1', 'saves state (controller and execution context) for a job')
            .example('$0 jobs save CLUSTER_ALIAS JOB1 JOB2', 'saves state for two jobs')
            .example('$0 jobs save CLUSTER_ALIAS all --status failing', 'saves state for failing jobs on a cluster')
            .example('$0 jobs save CLUSTER_ALIAS all -y', 'saves state for all jobs on a cluster and bypasses the prompt');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);

        try {
            await jobs.initialize();
            await jobs.save();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
