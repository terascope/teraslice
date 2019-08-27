import JobSrc from '../../helpers/job-src';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import { getTerasliceClient } from '../../helpers/utils';
import Reply from '../lib/reply';

const reply = new Reply();
const yargsOptions = new YargsOptions();

export = {
    command: 'status <job-file>',
    describe: 'View status of a job by referencing the job file',
    aliases: ['run'],
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-ignore
        yargs.example('$0 tjm status jobFile.json');
        return yargs;
    },
    async handler(argv) {
        const job = new JobSrc(argv);
        job.init();
        const client = getTerasliceClient(job);

        try {
            const response = await client.jobs.wrap(job.jobId).status();

            if (!response) {
                reply.fatal(`Could not get status for job ${job.name} on ${job.clusterUrl}`);
            }

            reply.green(`${job.name} is ${response} on ${job.clusterUrl}`);
        } catch (e) {
            reply.fatal(e.message);
        }
    }
} as CMD;
