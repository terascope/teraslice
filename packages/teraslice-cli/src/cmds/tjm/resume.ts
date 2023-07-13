import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import Config from '../../helpers/config';
import Jobs from '../../helpers/jobs';
import { validateJobFileAndAddToCliConfig } from '../../helpers/tjm-util';

const yargsOptions = new YargsOptions();

export = {
    command: 'resume <job-file...>',
    describe: 'resume a job by referencing the job file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('watch', yargsOptions.buildOption('jobs-watch'));
        // @ts-expect-error
        yargs.example('$0 tjm start jobFile.json');
        // @ts-expect-error
        yargs.example('$0 tjm run jobFile.json');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);

        validateJobFileAndAddToCliConfig(cliConfig);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.resume();
    }
} as CMD;
