import { CMD } from '../../interfaces';
import { updateJobConfig, validateJobFileAndAddToCliConfig } from '../../helpers/tjm-util';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'update <job-file...>',
    describe: 'Update a job by referencing the job file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('start', yargsOptions.buildOption('start'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('watch', yargsOptions.buildOption('jobs-watch'));
        // @ts-expect-error
        yargs.example('$0 tjm update jobFile.json');
        return yargs;
    },
    async handler(argv): Promise <void> {
        const cliConfig = new Config(argv);

        validateJobFileAndAddToCliConfig(cliConfig);

        const jobs = await updateJobConfig(cliConfig);

        if (jobs) {
            await jobs.initialize();
            await jobs.view();

            if (argv.start) {
                await jobs.restart();
            }
        }
    }
};

export = cmd;
