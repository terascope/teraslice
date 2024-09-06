import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import { validateAndUpdateCliConfig } from '../../helpers/tjm-util.js';
import Jobs from '../../helpers/jobs.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'delete <job-file...>',
    describe: 'Delete a job or jobs by referencing the job file. Jobs must be in a terminal state.',
    builder(yargs: any) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs
            .example('$0 tjm delete JOB_FILE.json', 'deletes a job')
            .example('$0 tjm delete JOB_FILE.json JOB_FILE2.json', 'deletes multiple jobs');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);

        validateAndUpdateCliConfig(cliConfig);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.delete();
    }
} as CMD;
