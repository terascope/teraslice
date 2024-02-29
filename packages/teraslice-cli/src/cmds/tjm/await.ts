/* eslint-disable import/no-import-module-exports */
import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Config from '../../helpers/config.js';
import { validateAndUpdateCliConfig } from '../../helpers/tjm-util.js';
import Jobs from '../../helpers/jobs.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'await <job-file...>',
    describe: 'Waits until a job or jobs reach a specified status or timeout expires',
    builder(yargs: any) {
        yargs.option('status', yargsOptions.buildOption('await-status'));
        yargs.options('timeout', yargsOptions.buildOption('timeout'));
        yargs.options('interval', yargsOptions.buildOption('interval'));
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.example('$0 tjm await JOB_FILE.json');
        yargs.example('$0 tjm await JOB_FILE.json --status completed --timeout 10000');
        yargs.example('$0 tjm await JOB_FILE.json --status failing stopping terminated rejected --timeout 600000 ');
        return yargs;
    },
    async handler(argv: any): Promise<void> {
        const cliConfig = new Config(argv);

        validateAndUpdateCliConfig(cliConfig);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.awaitStatus();
    }
} as CMD;
