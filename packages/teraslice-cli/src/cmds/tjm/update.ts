import { CMD } from '../../interfaces';
import { updateJobConfig, validateAndUpdateCliConfig } from '../../helpers/tjm-util';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'update <job-file...>',
    describe: 'Update a job config by referencing the job config file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('start', yargsOptions.buildOption('start'));
        yargs.options('timeout', yargsOptions.buildOption('timeout'));
        yargs.options('interval', yargsOptions.buildOption('interval'));
        yargs.options('watch', yargsOptions.buildOption('jobs-watch'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs
            .example('$0 tjm update JOB_FILE.json', 'updates job config')
            .example('$0 tjm update JOB_FILE.json --restart', 'updates job config and restarts job')
            .example('$0 tjm update JOB_FILE.json --restart --watch 100', 'updates job config, restarts, and watches for 100 slices')
            .example('$0 tjm update JOB_FILE.json JOB_FILE2.json --restart', 'updates job config, and restarts multiple jobs');
        return yargs;
    },
    async handler(argv): Promise <void> {
        const cliConfig = new Config(argv);

        validateAndUpdateCliConfig(cliConfig);

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
