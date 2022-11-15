import JobSrc from '../../helpers/job-src.js';
import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import { getTerasliceClient } from '../../helpers/utils.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'status <job-file>',
    describe: 'View status of a job by referencing the job file',
    aliases: ['run'],
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-expect-error
        yargs.example('$0 tjm status jobFile.json');
        return yargs;
    },
    async handler(argv): Promise <void> {
        const job = new JobSrc(argv);
        job.init();
        const client = getTerasliceClient(job);

        try {
            const response = await client.jobs.wrap(job.id).status();

            if (!response) {
                reply.fatal(`Could not get status for job ${job.name} on ${job.clusterUrl}`);
            }

            reply.green(`${job.name} is ${response} on ${job.clusterUrl}`);
        } catch (e) {
            reply.fatal(e.message);
        }
    }
};

export default cmd;
