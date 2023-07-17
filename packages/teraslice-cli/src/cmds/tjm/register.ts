import Config from '../../helpers/config';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import { registerJobToCluster, validateJobFileAndAddToCliConfig } from '../../helpers/tjm-util';

const yargsOptions = new YargsOptions();

export = {
    command: 'register <cluster-alias> <job-file...>',
    describe: 'Register a job to a cluster from a job file',
    aliases: ['reg'],
    builder(yargs) {
        yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('start', yargsOptions.buildOption('start'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('watch', yargsOptions.buildOption('jobs-watch'));
        // @ts-expect-error
        yargs.example('$0 tjm register localhost new-job.json');
        // @ts-expect-error
        yargs.example('$0 tjm register localhost new-job.json --start');
        // @ts-expect-error
        yargs.example('$0 tjm reg localhost new-job.json --start');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);

        validateJobFileAndAddToCliConfig(cliConfig);

        const jobs = await registerJobToCluster(cliConfig);

        if (jobs) {
            await jobs.initialize();

            await jobs.view();

            if (argv.start) {
                await jobs.start();
            }
        }
    }
} as CMD;
