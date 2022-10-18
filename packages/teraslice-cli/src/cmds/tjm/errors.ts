import JobSrc from '../../helpers/job-src.js';
import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';
import { getTerasliceClient } from '../../helpers/utils.js';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'errors <job-file>',
    describe: 'View errors of a job by referencing the job file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-expect-error
        yargs.example('$0 tjm errors jobFile.json');
        return yargs;
    },
    async handler(argv): Promise <void> {
        const job = new JobSrc(argv);
        job.init();
        const client = getTerasliceClient(job);

        try {
            const response = await client.jobs.wrap(job.id).errors();

            if (response.length === 0) {
                reply.green(`No errors for ${job.name} on ${job.clusterUrl}`);
            } else {
                reply.yellow(`Errors for ${job.name} on ${job.clusterUrl}:\n`);
                response.forEach((error: any) => reply.yellow(JSON.stringify(error, null, 4)));
            }
        } catch (e) {
            reply.fatal(e.message);
        }
    }
};

export default cmd;
