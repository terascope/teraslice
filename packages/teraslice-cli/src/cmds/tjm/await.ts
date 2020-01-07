import JobSrc from '../../helpers/job-src';
import Config from '../../helpers/config';
import { CMD } from '../../interfaces';
import * as TSClientTypes from 'teraslice-client-js';
import * as util from '@terascope/utils'
import YargsOptions from '../../helpers/yargs-options';
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
        // @ts-ignore
        const cliConfig = new Config(Object.assign(jobFile, argv));
        const jobs = new Jobs(cliConfig);


        const jobFuncs = await jobs.teraslice.client.jobs.wrap(jobs.config.argv.id);

        const desiredStatus: TSClientTypes.ExecutionStatus[] = jobs.config.args.status;

        if (jobs.config.args.start) {
            if (jobs.config.args.start) {
                // hack to get jobs.start to work without printing out too much stuff
                jobs.config.args.status = 'running,failing';

                await jobs.start();
            }
        }

        const currentStatus = await jobFuncs.status();

        reply.green(`> job: ${jobs.config.args.id} current status: ${currentStatus}`);

        reply.green(`> job: ${jobs.config.args.id} waiting for status ${desiredStatus.join(' or ')}`);

        // @ts-ignore
        const status = await Promise.all(desiredStatus.map(
            (status) => jobs.awaitStatus(status, jobFuncs, jobs.config.args.timeout)
        ));

        reply.green(`> job: ${jobs.config.args.id} reached status: ${status}`);
    }
};

module.exports = cmd;
