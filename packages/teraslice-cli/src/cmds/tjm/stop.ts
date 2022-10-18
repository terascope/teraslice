import TjmUtil from '../../helpers/tjm-util.js';
import JobSrc from '../../helpers/job-src.js';
import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import { getTerasliceClient } from '../../helpers/utils.js';

const yargsOptions = new YargsOptions();

// TODO: review old describe to this
export default {
    command: 'stop <job-file>',
    describe: 'Stop a job by referencing the job file',
    aliases: ['run'],
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-expect-error
        yargs.example('$0 tjm stop jobFile.json');
        return yargs;
    },
    async handler(argv) {
        const job = new JobSrc(argv);
        job.init();
        const client = getTerasliceClient(job);
        const tjmUtil = new TjmUtil(client, job);
        await tjmUtil.stop();
    }
} as CMD;
