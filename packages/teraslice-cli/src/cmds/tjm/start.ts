import { validateAndUpdateCliConfig } from '../../helpers/tjm-util';
import Config from '../../helpers/config';
import { CMD } from '../../interfaces';
import Jobs from '../../helpers/jobs';
import YargsOptions from '../../helpers/yargs-options';

const yargsOptions = new YargsOptions();

export = {
    command: 'start <job-file...>',
    describe: 'Start a job by referencing the job file',
    aliases: ['run'],
    builder(yargs: any) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('watch', yargsOptions.buildOption('jobs-watch'));
        yargs.strict()
            .example('$0 tjm start jobFile.json', 'starts teraslice job')
            .example('$0 tjm start jobFile1 jobFile2 --watch 1000', 'start multiple teraslice jobs');

        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);

        validateAndUpdateCliConfig(cliConfig);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.start();
    }
} as CMD;
