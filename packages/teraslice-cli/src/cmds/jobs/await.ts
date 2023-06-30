import YargsOptions from '../../helpers/yargs-options';
import Jobs from '../../helpers/jobs';
import reply from '../../helpers/reply';
import Config from '../../helpers/config';
import { CMD } from '../../interfaces';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'await <cluster-alias>  <job-id...>',
    describe: 'cli waits until job reaches a specified status or timeout expires',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
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

        await jobs.initialize();

        try {
            await jobs.awaitStatus();
        } catch (e) {
            reply.fatal(e.message);
        }
    }
};

export = cmd;
