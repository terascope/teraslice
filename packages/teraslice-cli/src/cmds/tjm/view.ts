import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Config from '../../helpers/config.js';
import { validateAndUpdateCliConfig } from '../../helpers/tjm-util.js';
import Jobs from '../../helpers/jobs.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'view <job-file...>',
    describe: 'View job as saved on the cluster by referencing the job file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.option('diff', yargsOptions.buildOption('diff'));
        yargs
            .example('$0 tjm view JOB_FILE.json', 'displays job config on job cluster')
            .example('$0 tjm view JOB_FILE.json --diff', 'displays diff between job config on job cluster and the local json file')
            .example('$0 tjm view JOB_FILE1.json JOB_FILE2.json', 'displays config for multiple job files');
        return yargs;
    },
    async handler(argv): Promise <void> {
        const cliConfig = new Config(argv);

        validateAndUpdateCliConfig(cliConfig);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.view();
    }
} as CMD;
