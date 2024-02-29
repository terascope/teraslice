import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Config from '../../helpers/config.js';
import { validateAndUpdateCliConfig } from '../../helpers/tjm-util.js';
import Jobs from '../../helpers/jobs.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'restart <job-file...>',
    describe: 'Restart a job by referencing the job config file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('timeout', yargsOptions.buildOption('timeout'));
        yargs.options('interval', yargsOptions.buildOption('interval'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('watch', yargsOptions.buildOption('jobs-watch'));
        yargs.options('max-workers', yargsOptions.buildOption('max-workers'));
        yargs
            .example('$0 tjm restart JOB_FILE.json', 'restarts the job')
            .example('$0 tjm restart JOB_FILE.json JOB_FILE2.json', 'restarts multiple jobs')
            .example('$0 tjm restart JOB_FILE.json JOB_FILE2.json --watch 100', 'restarts multiple jobs, watches for 100 successful slices');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);
        validateAndUpdateCliConfig(cliConfig);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.restart();
    }
} as CMD;
