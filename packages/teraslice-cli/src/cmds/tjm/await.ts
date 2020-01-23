import * as util from '@terascope/utils';
import * as TSClientTypes from 'teraslice-client-js';
import Config from '../../helpers/config';
import Jobs from '../../helpers/jobs';
import YargsOptions from '../../helpers/yargs-options';
import JobSrc from '../../helpers/job-src';
import { CMD } from '../../interfaces';
import Reply from '../lib/reply';

const yargsOptions = new YargsOptions();
const reply = new Reply();

const cmd: CMD = {
    command: 'await <job-file>',
    describe: 'cli waits until the job reaches a specified status or timeout expires',
    builder(yargs: any) {
        yargs.option('status', yargsOptions.buildOption('await-status'));
        yargs.options('timeout', yargsOptions.buildOption('await-timeout'));
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

        const cliConfig = new Config({ ...jobFile, ...argv});
        const jobs = new Jobs(cliConfig);


        const desiredStatus: TSClientTypes.ExecutionStatus[] = argv.status;

        reply.green(`> job: ${jobFile.id} waiting for status ${desiredStatus.join(' or ')}`);

        const status = await jobs.awaitManyStatuses(desiredStatus, jobFile.id, argv.timeout);

        reply.green(`> job: ${jobFile.id} reached status: ${status}`);
        process.exit(0);
    }
};

module.exports = cmd;
