import Config from '../../helpers/config.js';
import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import { validateAndUpdateCliConfig } from '../../helpers/tjm-util.js';
import Jobs from '../../helpers/jobs.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'workers <action> <number> <job-file...>',
    describe: 'Add workers to a job',
    builder(yargs) {
        yargs.positional('action', yargsOptions.buildPositional('worker-action'));
        yargs.positional('number', yargsOptions.buildPositional('worker-number'));
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.example('$0 tjm workers add 10 JOBFILE.json', 'add 10 workers to a job')
            .example('$0 tjm workers remove 10 JOBFILE.json', 'remove 10 workers to a job')
            .example('$0 tjm workers add 10 JOBFILE1.json JOBFILE2.json', 'add workers to multiple jobs')
            .example('$0 tjm workers total 40 JOBFILE.json', 'set the total number of workers for a job to 40');

        return yargs;
    },
    async handler(argv): Promise <void> {
        const cliConfig = new Config(argv);

        validateAndUpdateCliConfig(cliConfig);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.adjustWorkers();
    }
} as CMD;
