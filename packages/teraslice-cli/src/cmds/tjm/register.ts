import Config from '../../helpers/config';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import { registerJobToCluster } from '../../helpers/tjm-util';

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
        yargs.options('watch', yargsOptions.buildOption('jobs-watch'));
        yargs.example('$0 tjm register CLUSTER JOBFILE.json', 'registers job on cluster')
            .example('$0 tjm register CLUSTER JOBFILE.json --start', 'registers and starts job')
            .example('$0 tjm register CLUSTER JOBFILE1.json JOBFILE2.json --start', 'registers and starts multiple jobs')
            .example('$0 tjm register CLUSTER JOBFILE1.json JOBFILE2.json --start --watch 1000', 'registers and starts multiple jobs, watches for 1000 successful slices')
            .example('$0 tjm reg CLUSTER new-job.json', 'reg alias for register');

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
