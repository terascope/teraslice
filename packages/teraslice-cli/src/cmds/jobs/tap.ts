import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Jobs from '../../helpers/jobs.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'tap <cluster-alias> <job-id...>',
    describe: 'Request a slice tap for a running job',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('size', yargsOptions.buildOption('tap-size'));
        yargs.strict()
            .example('$0 jobs tap CLUSTER_ALIAS JOB_ID')
            .example('$0 jobs tap CLUSTER_ALIAS JOB_ID --size 1', 'return at most 1 record per operation')
            .example('$0 jobs tap CLUSTER_ALIAS JOB_ID --size all', 'return every record');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);

        if (cliConfig.args.jobId.length > 1 || cliConfig.args.jobId.includes('all')) {
            throw new Error('Tap command only accepts one job at a time.');
        }

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.tap();
    }
} as CMD;
