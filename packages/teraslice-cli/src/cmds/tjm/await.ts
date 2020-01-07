import TjmUtil from '../../helpers/tjm-util';
import JobSrc from '../../helpers/job-src';
import Config from '../../helpers/config';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import { getTerasliceClient } from '../../helpers/utils';
import Jobs from '../../helpers/jobs';

const yargsOptions = new YargsOptions();

const cmd = {
    command: 'await <job-file>',
    describe: 'cli blocks/ waits until the job reaches the entered status or timeout expires',
    builder(yargs:any) {
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
        jobs.awaitCommand();
    }
};

module.exports = cmd;
