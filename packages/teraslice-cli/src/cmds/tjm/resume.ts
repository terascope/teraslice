import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import Config from '../../helpers/config';
import Jobs from '../../helpers/jobs';
import { validateAndUpdateCliConfig } from '../../helpers/tjm-util';

const yargsOptions = new YargsOptions();

export = {
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

        const jobs = validateAndUpdateCliConfig(cliConfig);

        await jobs.initialize();

        await jobs.resume();
    }
} as CMD;
