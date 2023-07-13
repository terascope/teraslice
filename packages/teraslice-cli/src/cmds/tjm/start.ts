import { validateJobFileAndAddToCliConfig } from '../../helpers/tjm-util';
import Config from '../../helpers/config';
import { CMD } from '../../interfaces';
import Jobs from '../../helpers/jobs';
import YargsOptions from '../../helpers/yargs-options';

const yargsOptions = new YargsOptions();

export = {
    command: 'start <job-file...>',
    describe: 'Start a job by referencing the job file',
    aliases: ['run'],
    builder(yargs: any) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('watch', yargsOptions.buildOption('jobs-watch'));
        yargs.strict()
            .example('$0 tjm start jobFile.json');

        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);

        validateJobFileAndAddToCliConfig(cliConfig);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.start();
    }
} as CMD;
