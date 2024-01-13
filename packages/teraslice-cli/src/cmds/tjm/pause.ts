import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import Config from '../../helpers/config';
import { validateAndUpdateCliConfig } from '../../helpers/tjm-util';
import Jobs from '../../helpers/jobs';

const yargsOptions = new YargsOptions();

export = {
    command: 'pause <job-file...>',
    describe: 'Pause a job or jobs by referencing the job file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs
            .example('$0 tjm pause JOB_FILE.json', 'pauses a job')
            .example('$0 tjm pause JOB_FILE.json JOB_FILE2', 'pauses multiple jobs');

        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);

        validateAndUpdateCliConfig(cliConfig);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.pause();
    }
} as CMD;
