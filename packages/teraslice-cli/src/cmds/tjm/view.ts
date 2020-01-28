import JobSrc from '../../helpers/job-src';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import { getTerasliceClient } from '../../helpers/utils';
import Reply from '../lib/reply';

const reply = new Reply();
const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'view <job-file>',
    describe: 'View job as saved on the cluster by referencing the job file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-ignore
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

export = cmd;
