import _ from 'lodash';
import Config from '../../helpers/config';
import TjmUtil from '../../helpers/tjm-util';
import { getTerasliceClient } from '../../helpers/utils';
import JobSrc from '../../helpers/job-src';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import Reply from '../lib/reply';

const reply = new Reply();
const yargsOptions = new YargsOptions();

export = {
    command: 'register <cluster-alias> <job-file>',
    describe: 'Register a job to a cluster from a job file',
    aliases: ['reg'],
    builder(yargs) {
        yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('start', yargsOptions.buildOption('start'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-ignore
        yargs.example('$0 tjm register localhost new-job.json');
        // @ts-ignore
        yargs.example('$0 tjm register localhost new-job.json --start');
        // @ts-ignore
        yargs.example('$0 tjm reg localhost new-job.json --start');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);
        const job = new JobSrc(argv);
        const client = getTerasliceClient(cliConfig);

        if (job.hasMetaData) {
            const regCluster = _.get(job.content, '__metadata.cli.cluster');
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
