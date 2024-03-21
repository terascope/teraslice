import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Jobs from '../../helpers/jobs.js';

const yargsOptions = new YargsOptions();

export default {
    // TODO: is it [id] or <id>
    command: 'view <cluster-alias> <job-id...>',
    describe: 'View the job definition for a job or multiple jobs',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.strict()
            .example('$0 jobs view CLUSTER_ALIAS JOB_ID')
            .example('$0 jobs view CLUSTER_ALIAS JOB_ID1 JOB_ID2', 'view config for two jobs');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.view();
    }
} as CMD;
