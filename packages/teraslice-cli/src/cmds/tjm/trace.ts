import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Config from '../../helpers/config.js';
import { validateAndUpdateCliConfig } from '../../helpers/tjm-util.js';
import Jobs from '../../helpers/jobs.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'trace <job-file...>',
    describe: 'Request a slice trace for a job by referencing the job file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('size', yargsOptions.buildOption('trace-size'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs
            .example('$0 tjm trace JOB_FILE.json', 'traces a job');

        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);
        validateAndUpdateCliConfig(cliConfig);

        const job = new Jobs(cliConfig);

        if (job.config.args.jobFile.length > 1) {
            throw new Error('Trace command only accepts one job at a time.');
        }

        await job.initialize();

        await job.trace();
    }
} as CMD;
