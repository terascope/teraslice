import YargsOptions from '../../helpers/yargs-options.js';
import Jobs from '../../helpers/jobs.js';
import reply from '../../helpers/reply.js';
import Config from '../../helpers/config.js';
import { CMD } from '../../interfaces.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'await <cluster-alias>  <job-id...>',
    describe: 'waits until job or jobs reaches a specified status or timeout expires',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('status', yargsOptions.buildOption('await-status'));
        yargs.options('timeout', yargsOptions.buildOption('timeout'));
        yargs.options('interval', yargsOptions.buildOption('interval'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.strict()
            .example('$0 jobs await CLUSTER_ALIAS JOB_ID --status completed', 'wait until job is completed')
            .example('$0 jobs await CLUSTER_ALIAS JOB_ID1 JOB_ID2  --status running --timeout 10000', 'waits for job to reach running status, times out after 10 seconds')
            .example('$0 jobs await CLUSTER_ALIAS JOB_ID --status failing rejected pending --timeout 300000', 'waits for a job to reach failing rejected or pending status, times out after 5 minutes');
        return yargs;
    },
    async handler(argv): Promise<void> {
        const cliConfig = new Config(argv);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        try {
            await jobs.awaitStatus();
        } catch (e) {
            reply.fatal(e.message);
        }
    }
} as CMD;
