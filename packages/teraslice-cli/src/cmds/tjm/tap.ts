import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Config from '../../helpers/config.js';
import { validateAndUpdateCliConfig } from '../../helpers/tjm-util.js';
import Jobs from '../../helpers/jobs.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'tap <job-file...>',
    describe: 'Request a slice tap for a job by referencing the job file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('size', yargsOptions.buildOption('tap-size'));
        yargs.option('yes', yargsOptions.buildOption('yes'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs
            .example('$0 tjm tap JOB_FILE.json', 'taps a job');

        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);
        validateAndUpdateCliConfig(cliConfig);

        const jobs = new Jobs(cliConfig);

        if (jobs.config.args.jobFile.length > 1) {
            throw new Error('Tap command only accepts one job at a time.');
        }

        await jobs.initialize();

        await jobs.tap();
    }
} as CMD;
