import Config from '../../helpers/config';
import Jobs from '../../helpers/jobs';
import YargsOptions from '../../helpers/yargs-options';
import JobSrc from '../../helpers/job-src';
import { CMD } from '../../interfaces';
import reply from '../../helpers/reply';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'await <job-file>',
    describe: 'cli waits until the job reaches a specified status or timeout expires',
    builder(yargs: any) {
        yargs.option('status', yargsOptions.buildOption('await-status'));
        yargs.options('timeout', yargsOptions.buildOption('await-timeout'));
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.example('$0 tjm await FILE.JSON');
        yargs.example('$0 tjm await FILE.JSON --status completed --timeout 10000');
        yargs.example('$0 tjm await FILE.JSON --status failing stopping terminated rejected --timeout 600000 ');
        return yargs;
    },
    async handler(argv: any): Promise<void> {
        const jobFile = new JobSrc(argv);
        jobFile.init();

        const cliConfig = new Config({ ...jobFile, ...argv });
        const jobs = new Jobs(cliConfig);

        reply.green(`> job: ${jobFile.id} waiting for status ${argv.status.join(' or ')}`);

        try {
            const status = await jobs.awaitStatus();
            reply.green(`> job: ${jobFile.id} reached status: ${status}`);
        } catch (e) {
            reply.fatal(e.message);
        }
    }
};

module.exports = cmd;
