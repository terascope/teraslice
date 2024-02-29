import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Config from '../../helpers/config.js';
import { validateAndUpdateCliConfig } from '../../helpers/tjm-util.js';
import Jobs from '../../helpers/jobs.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'resume <job-file...>',
    describe: 'Resume a job by referencing the job file, job must be paused to resume',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs
            .example('$0 tjm resume JOB_FILE.json', 'resumes a paused job')
            .example('$0 tjm resume JOB_FILE.json JOB_FILE2.json', 'resumes multiple jobs');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);

        validateAndUpdateCliConfig(cliConfig);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.resume();
    }
} as CMD;
