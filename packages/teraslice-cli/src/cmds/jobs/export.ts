import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Jobs from '../../helpers/jobs.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'export <cluster-alias> <job-id...>',
    describe: 'Export job on a cluster to a json file. By default the file is saved as ~/.teraslice/export/<cluster-alias>/<job.name>.json\n',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('export-dir', yargsOptions.buildOption('export-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('file-name', yargsOptions.buildOption('file-name'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.check((argv: { jobId: string[]; fileName: string[]; }) => {
            if (argv.fileName && argv.fileName.length !== argv.jobId.length) {
                throw new Error('The number of job IDs must match the number of file names');
            }
            return true;
        });
        yargs.strict()
            .example('$0 jobs export CLUSTER_ALIAS JOB1', 'exports job config as a tjm compatible JSON file')
            .example('$0 jobs export CLUSTER_ALIAS JOB1 JOB2', 'exports job config for two jobs')
            .example('$0 jobs export CLUSTER_ALIAS JOB1 JOB2 --file-name name1.json name2.json', 'exports two jobs with custom file names')
            .example('$0 jobs export CLUSTER_ALIAS JOB1 --export-dir ./my_jobs -f job_1.json', 'exports a job to ./my_jobs/job_1.json')
            .example('$0 jobs export CLUSTER_ALIAS all --status failing', 'exports all failing jobs on a cluster')
            .example('$0 jobs export CLUSTER_ALIAS all -y', 'exports all jobs on a cluster and bypasses the prompt');
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
