import { CMD } from '../../interfaces.js';
import { validateAndUpdateCliConfig } from '../../helpers/tjm-util.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Jobs from '../../helpers/jobs.js';

const yargsOptions = new YargsOptions();

export default {
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

        validateAndUpdateCliConfig(cliConfig);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.stop();
    }
} as CMD;
