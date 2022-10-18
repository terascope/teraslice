import JobSrc from '../../helpers/job-src.js';
import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import { getTerasliceClient } from '../../helpers/utils.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'view <job-file>',
    describe: 'View job as saved on the cluster by referencing the job file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-expect-error
        yargs.example('$0 tjm view jobFile.json');
        return yargs;
    },
    async handler(argv): Promise <void> {
        const job = new JobSrc(argv);
        job.init();
        const client = getTerasliceClient(job);

        try {
            const response = await client.jobs.wrap(job.id).config();

            reply.yellow(`${job.name} on ${job.clusterUrl}:`);
            reply.green(JSON.stringify(response, null, 4));
        } catch (e) {
            reply.fatal(e.message);
        }
    }
};

export default cmd;
