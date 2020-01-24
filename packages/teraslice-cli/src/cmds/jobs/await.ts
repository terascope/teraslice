import * as TSClientTypes from 'teraslice-client-js';
import YargsOptions from '../../helpers/yargs-options';
import Jobs from '../../helpers/jobs';
import Reply from '../lib/reply';
import Config from '../../helpers/config';
import { CMD } from '../../interfaces';

const yargsOptions = new YargsOptions();
const reply = new Reply();

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

        const desiredStatus: TSClientTypes.ExecutionStatus[] = jobs.config.args.status;

        reply.info(`> job: ${jobs.config.args.id} waiting for status ${desiredStatus.join(' or ')}`);

        const newStatus = await jobs.awaitManyStatuses(
            desiredStatus,
            jobs.config.args.id,
            jobs.config.args.timeout
        );

        reply.info(`> job: ${jobs.config.args.id} reached status: ${newStatus}`);
        process.exit(0);
    }
};

export = cmd;
