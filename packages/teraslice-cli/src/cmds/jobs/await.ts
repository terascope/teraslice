import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Jobs from '../../helpers/jobs';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'await <cluster-alias> <id>',
    describe: 'waits for jobs to reach specified status',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('await-status'));
        yargs.options('timeout', yargsOptions.buildOption('await-timeout'));
        yargs.options('start', yargsOptions.buildOption('start'));
        yargs.strict()
            .example('$0 jobs await CLUSTER_ALIAS JOBID --status completed --timeout 10000')
            .example('$0 jobs await CLUSTER_ALIAS JOBID --status completed --timeout 10000 --start')
        return yargs;
    },
    async handler(argv): Promise<void> {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);
        jobs.await();
    }
};

export = cmd;
