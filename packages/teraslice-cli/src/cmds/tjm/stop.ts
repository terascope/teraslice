import { CMD } from '../../interfaces';
import { validateAndUpdateCliConfig } from '../../helpers/tjm-util';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';

const yargsOptions = new YargsOptions();

export = {
    command: 'stop <job-file...>',
    describe: 'Stop a job by referencing the job file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs
            .example('$0 tjm stop JOB_FILE.json', 'stops job')
            .example('$0 tjm stop JOB_FILE.json JOB_FILE2.json', 'stops multiple jobs');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);

        const jobs = validateAndUpdateCliConfig(cliConfig);

        await jobs.initialize();

        await jobs.stop();
    }
} as CMD;
