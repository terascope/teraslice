import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Jobs from '../../helpers/jobs.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'export <cluster-alias> <job-id...>',
    describe: 'Export job on a cluster to a json file. By default the file is saved to current working directory as <job.name>.json\n',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('outdir', yargsOptions.buildOption('outdir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.strict()
            .example('$0 jobs export CLUSTER_ALIAS JOB1', 'exports job config as a tjm compatible JSON file')
            .example('$0 jobs export CLUSTER_ALIAS JOB1 JOB2', 'exports job config for two jobs')
            .example('$0 jobs export CLUSTER_ALIAS JOB1 --outdir ./my_jobs', 'exports a job to ./my_jobs/<job.name>.json')
            .example('$0 jobs export CLUSTER_ALIAS all --status failing', 'exports all failing jobs on a cluster (maximum 100)')
            .example('$0 jobs export CLUSTER_ALIAS all -y', 'exports all jobs on a cluster (maximum 100) and bypasses any prompts');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);

        try {
            await jobs.initialize();
            await jobs.export();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
