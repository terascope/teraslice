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
    describe: 'wait for job to reach a specified status, can await for more than one status',
    builder(yargs:any) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.option('status', yargsOptions.buildOption('await-status'));
        yargs.options('timeout', yargsOptions.buildOption('await-timeout'));
        yargs.option('start', yargsOptions.buildOption('start'));
        // @ts-ignore
        yargs.example('$0 tjm await FILE.JSON --status stopped');
        // @ts-ignore
        yargs.example('$0 tjm run FILE.JSON --status completed --start --timeout 1000');
        yargs.example('$0 tjm run FILE.JSON --status completed stopped --start --timeout 1000');
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
