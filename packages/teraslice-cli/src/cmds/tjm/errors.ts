import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import Config from '../../helpers/config';
import { validateAndUpdateCliConfig } from '../../helpers/tjm-util';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'errors <job-file...>',
    describe: 'View errors of a job by referencing the job file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.example('$0 tjm errors JOB_FILE.json', 'Displays errors for the job');
        return yargs;
    },
    async handler(argv): Promise <void> {
        const cliConfig = new Config(argv);

        const jobs = validateAndUpdateCliConfig(cliConfig);

        await jobs.initialize();

        await jobs.checkForErrors();
    }
};

export = cmd;
