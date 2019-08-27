import JobSrc from '../../helpers/job-src';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import { getTerasliceClient } from '../../helpers/utils';
import Reply from '../lib/reply';

const reply = new Reply();
const yargsOptions = new YargsOptions();

export = {
    command: 'workers <worker-action> <number> <job-file>',
    describe: 'Add workers to a job',
    builder(yargs) {
        yargs.positional('worker-action', yargsOptions.buildPositional('worker-action'));
        yargs.positional('number', yargsOptions.buildPositional('number'));
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-ignore
        yargs.example('$0 tjm workers add 10 jobFile.json');
        // @ts-ignore
        yargs.example('$0 tjm workers remove 10 jobFile.json');
        // @ts-ignore
        yargs.example('$0 tjm workers total 40 jobFile.json');
        return yargs;
    },
    async handler(argv) {
        const job = new JobSrc(argv);
        job.init();
        const client = getTerasliceClient(job);

        try {
            const currentStatus = await client.jobs.wrap(job.jobId).status();
            if (currentStatus !== 'running') {
                reply.fatal(`${job.name} is currently ${currentStatus} and workers cannot be added`);
            }

            const workers = await client.jobs.wrap(job.jobId)
            // @ts-ignore
                .changeWorkers(argv.workerAction, argv.number);
            if (!workers) {
                reply.fatal(`Workers could not be added to ${job.name} on ${job.clusterUrl}`);
            }
            reply.green(`${workers} for ${job.name} on ${job.clusterUrl}`);
        } catch (e) {
            reply.fatal(e.message);
        }
    }
} as CMD;
