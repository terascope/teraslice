import * as TSClientTypes from 'teraslice-client-js';
import * as util from '@terascope/utils';
import TjmUtil from '../../helpers/tjm-util';
import { getTerasliceClient } from '../../helpers/utils';
import YargsOptions from '../../helpers/yargs-options';
import JobSrc from '../../helpers/job-src';
import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import Jobs from '../../helpers/jobs';
import Reply from '../lib/reply';

const yargsOptions = new YargsOptions();
const reply = new Reply();

const cmd: CMD = {
    command: 'await <job-file>',
    describe: 'cli waits until the job reaches a specified status or timeout expires',
    builder(yargs: any) {
        yargs.option('status', yargsOptions.buildOption('await-status'));
        yargs.options('timeout', yargsOptions.buildOption('await-timeout'));
        yargs.option('start', yargsOptions.buildOption('start'));
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-ignore
        yargs.example('$0 tjm await FILE.JSON');
        yargs.example('$0 tjm await FILE.JSON --start');
        yargs.example('$0 tjm run FILE.JSON --status completed --timeout 10000 --start');
        yargs.example('$0 tjm await FILE.JSON --status failing stopping terminated rejected --timeout 600000 --start');
        return yargs;
    },
    async handler(argv: any): Promise<void> {
        const jobFile = new JobSrc(argv);
        jobFile.init();

        const client = getTerasliceClient(jobFile);
        const tjmUtil = new TjmUtil(client, jobFile);

        const desiredStatus: TSClientTypes.ExecutionStatus[] = argv.status;

        if (argv.start) {
            await tjmUtil.start();
            await util.pDelay(2500);
        }

        const jobFuncs = await client.jobs.wrap(jobFile.jobId);
        const currentStatus = await jobFuncs.status();

        reply.green(`> job: ${jobFile.jobId} current status: ${currentStatus}`);

        reply.green(`> job: ${jobFile.jobId} waiting for status ${desiredStatus.join(' or ')}`);

        let newStatus;

        try {
            newStatus = await util.pRace(desiredStatus.map(
                (status) => jobFuncs.waitForStatus(status, 5000, argv.timeout)
            ));
        } catch (e) {
            // @ts-ignore
            if (!e.fatalError && desiredStatus.includes(e.context.lastStatus)) {
                newStatus = e.context.lastStatus;
            } else {
                reply.fatal(e.message);
            }
        }

        reply.green(`> job: ${jobFile.jobId} reached status: ${newStatus}`);
    }
};

module.exports = cmd;
