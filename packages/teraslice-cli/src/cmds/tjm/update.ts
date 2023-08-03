import { CMD } from '../../interfaces';
import { updateJobConfig, validateAndUpdateCliConfig } from '../../helpers/tjm-util';
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
        yargs.options('watch', yargsOptions.buildOption('jobs-watch'));
        yargs
            .example('$0 tjm update JOBFILE.json', 'updates job config')
            .example('$0 tjm update JOBFILE.json --restart', 'updates job config and restarts job')
            .example('$0 tjm update JOBFILE.json --restart --watch 100', 'updates job config, restarts, and watches for 100 slices')
            .example('$0 tjm update JOBFILE.json JOBFILE2.json --restart', 'updates job config, and restarts multiple jobs');
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
