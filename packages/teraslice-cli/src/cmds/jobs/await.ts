import * as TSClientTypes from 'teraslice-client-js';
import * as util from '@terascope/utils';
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
        yargs.options('start', yargsOptions.buildOption('start'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.strict()
            .example('$0 jobs await CLUSTER_ALIAS JOBID')
            .example('$0 jobs await CLUSTER_ALIAS JOBID --start')
            .example('$0 jobs await CLUSTER_ALIAS JOBID --status running --timeout 10000 --start')
            .example('$0 jobs await CLUSTER_ALIAS JOBID --status failing rejected pending --timeout 300000 --start');
        return yargs;
    },
    async handler(argv): Promise<void> {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);

        const desiredStatus: TSClientTypes.ExecutionStatus[] = jobs.config.args.status;

        if (jobs.config.args.start) {
            // hack to get jobs.start to work without over logging
            jobs.config.args.status = 'running,failing';

            await jobs.start();
        }

        let newStatus;
        // @ts-ignore
        try {
            newStatus = await util.pRace(desiredStatus.map(
                (status) => jobs.awaitStatus(
                    status,
                    jobs.config.args.id,
                    jobs.config.args.timeout
                )
            ));
            reply.green(`> job: ${jobs.config.args.id} reached status: ${newStatus}`);
        } catch (e) {
             // @ts-ignore
             if (!e.fatalError && desiredStatus.includes(e.context.lastStatus)) {
                newStatus = e.context.lastStatus;
            } else {
                reply.fatal(e.message);
            }
        }

        reply.green(`> job: ${jobs.config.args.id} reached status: ${newStatus}`);
    }
};

export = cmd;
