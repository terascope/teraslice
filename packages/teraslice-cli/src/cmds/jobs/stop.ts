import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Jobs from '../../helpers/jobs.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'stop <cluster-alias> <job-id...>',
    describe: 'stops job(s) on the cluster, option to save running job(s) to a json file.\n',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('save', yargsOptions.buildOption('jobs-save'));
        yargs.options('timeout', yargsOptions.buildOption('timeout'));
        yargs.options('interval', yargsOptions.buildOption('interval'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.strict()
            .example('$0 jobs stop CLUSTER_ALIAS JOB_ID1', 'stops job on the cluster')
            .example('$0 jobs stop CLUSTER_ALIAS JOB_ID1 JOB_ID2', 'stops two jobs on the cluster')
            .example('$0 jobs stop CLUSTER_ALIAS all --yes', 'stops all the jobs on the cluster bypasses the prompt to continue')
            .example('$0 jobs stop CLUSTER_ALIAS all', 'stops all jobs on the cluster and saves jobs locally to a json file in the .teraslice dir');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        try {
            await jobs.stop();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
