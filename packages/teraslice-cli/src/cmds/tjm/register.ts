import { get } from '@terascope/utils';
import Config from '../../helpers/config.js';
import TjmUtil from '../../helpers/tjm-util.js';
import { getTerasliceClient } from '../../helpers/utils.js';
import JobSrc from '../../helpers/job-src.js';
import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'register <cluster-alias> <job-file>',
    describe: 'Register a job to a cluster from a job file',
    aliases: ['reg'],
    builder(yargs) {
        yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('start', yargsOptions.buildOption('start'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
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
        const job = new JobSrc(argv);
        const client = getTerasliceClient(cliConfig);

        if (job.hasMetaData) {
            const regCluster = get(job.content, '__metadata.cli.cluster');
            reply.fatal(`job has already been registered on ${regCluster}`);
        }
        job.readFile();
        job.validateJob();
        try {
            const registeredResponse = await client.jobs
                .submit(job.content, true);

            const jobId = registeredResponse.id();

            if (registeredResponse) {
                reply.green(`Successfully registered ${job.content.name} on ${cliConfig.clusterUrl} with job id ${jobId}`);
            } else {
                reply.fatal(`Failed to register ${job.content.name} on ${cliConfig.clusterUrl}`);
            }

            job.addMetaData(jobId, cliConfig.clusterUrl);
            job.overwrite();
        } catch (e) {
            reply.fatal(e.message);
        }

        if (argv.start) {
            job.init();
            const tjmUtil = new TjmUtil(client, job);
            tjmUtil.start();
        }
    }
} as CMD;
