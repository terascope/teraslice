import Config from '../../helpers/config';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import { registerJobToCluster } from '../../helpers/tjm-util';

const yargsOptions = new YargsOptions();

export = {
    command: 'register <cluster-alias> <job-file...>',
    describe: 'Register and upload a new job config to a cluster from a job config file',
    aliases: ['reg'],
    builder(yargs) {
        yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('start', yargsOptions.buildOption('start'));
        yargs.options('timeout', yargsOptions.buildOption('timeout'));
        yargs.options('interval', yargsOptions.buildOption('interval'));
        yargs.options('watch', yargsOptions.buildOption('jobs-watch'));
        yargs.options('max-workers', yargsOptions.buildOption('max-workers'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.example('$0 tjm register CLUSTER JOB_FILE.json', 'registers job on cluster')
            .example('$0 tjm register CLUSTER JOB_FILE.json --start', 'registers and starts job')
            .example('$0 tjm register CLUSTER JOB_FILE1.json JOB_FILE2.json --start', 'registers and starts multiple jobs')
            .example('$0 tjm register CLUSTER JOB_FILE1.json JOB_FILE2.json --start --watch 1000', 'registers and starts multiple jobs, watches for 1000 successful slices')
            .example('$0 tjm reg CLUSTER JOB_FILE.json', 'reg alias for register');

        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);

        const jobs = await registerJobToCluster(cliConfig);

        if (jobs && argv.start) {
            await jobs.initialize();

            await jobs.start();
        }
    }
} as CMD;
