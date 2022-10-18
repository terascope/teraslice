import YargsOptions from '../../helpers/yargs-options.js';
import Jobs from '../../helpers/jobs.js';
import reply from '../../helpers/reply.js';
import Config from '../../helpers/config.js';
import { CMD } from '../../interfaces.js';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'await <cluster-alias> <id>',
    describe: 'cli waits until job reaches a specified status or timeout expires',
    builder(yargs: any) {
        yargs.options('status', yargsOptions.buildOption('await-status'));
        yargs.options('timeout', yargsOptions.buildOption('await-timeout'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.strict()
            .example('$0 jobs await CLUSTER_ALIAS JOBID')
            .example('$0 jobs await CLUSTER_ALIAS JOBID --status running --timeout 10000')
            .example('$0 jobs await CLUSTER_ALIAS JOBID --status failing rejected pending --timeout 300000');
        return yargs;
    },
    async handler(argv): Promise<void> {
        const cliConfig = new Config(argv);

        const jobs = new Jobs(cliConfig);

        reply.info(`> job: ${jobs.config.args.id} waiting for status ${jobs.config.args.status.join(' or ')}`);

        try {
            const newStatus = await jobs.awaitStatus();
            reply.info(`> job: ${jobs.config.args.id} reached status: ${newStatus}`);
        } catch (e) {
            reply.fatal(e.message);
        }
    }
};

export default cmd;
