import TjmUtil from '../../helpers/tjm-util';
import JobSrc from '../../helpers/job-src';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import { getTerasliceClient } from '../../helpers/utils';

const yargsOptions = new YargsOptions();

export = {
    command: 'pause <job-file>',
    describe: 'pause a job by referencing the job file',
    aliases: ['run'],
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-ignore
        yargs.example('$0 tjm start jobFile.json');
        // @ts-ignore
        yargs.example('$0 tjm run jobFile.json');
        return yargs;
    },
    async handler(argv) {
        const job = new JobSrc(argv);
        job.init();
        const client = getTerasliceClient(job);
        const tjmUtil = new TjmUtil(client, job);
        await tjmUtil.pause();
    }
} as CMD;
