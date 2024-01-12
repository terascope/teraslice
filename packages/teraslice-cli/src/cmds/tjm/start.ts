import { validateAndUpdateCliConfig } from '../../helpers/tjm-util';
import Config from '../../helpers/config';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import Jobs from '../../helpers/jobs';

const yargsOptions = new YargsOptions();

export = {
    command: 'start <job-file...>',
    describe: 'Start a job by referencing the job file',
    aliases: ['run'],
    builder(yargs: any) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('timeout', yargsOptions.buildOption('timeout'));
        yargs.options('interval', yargsOptions.buildOption('interval'));
        yargs.options('watch', yargsOptions.buildOption('jobs-watch'));
        yargs.options('max-workers', yargsOptions.buildOption('max-workers'));
        yargs.strict()
            .example('$0 tjm start JOB_FILE.json', 'starts teraslice job')
            .example('$0 tjm start JOB_FILE.json JOB_FILE.json --watch 1000', 'start multiple teraslice jobs and watch for 1000 successful slices');

        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);

        validateAndUpdateCliConfig(cliConfig);

        const jobs = new Jobs(cliConfig);

        jobs.verifyK8sImageContinuity(cliConfig);

        await jobs.initialize();

        await jobs.start();
    }
} as CMD;
