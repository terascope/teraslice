import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import Config from '../../helpers/config';
import Jobs from '../../helpers/jobs';
import { validateJobFileAndAddToCliConfig } from '../../helpers/tjm-util';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'view <job-file...>',
    describe: 'View job as saved on the cluster by referencing the job file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        // @ts-expect-error
        yargs.example('$0 tjm view jobFile.json');
        return yargs;
    },
    async handler(argv): Promise <void> {
        const cliConfig = new Config(argv);

        validateJobFileAndAddToCliConfig(cliConfig);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.view();
    }
};

export = cmd;
