
import TjmUtil from '../../lib/tjm-util';
import _ from 'lodash';
import JobSrc from '../../lib/job-src';
import { CMD } from '../../interfaces';
import YargsOptions from '../../lib/yargs-options';
import { getTerasliceClient } from '../../lib/utils';

const yargsOptions = new YargsOptions();

export default {
    command: 'restart <job-file>',
    describe: 'Restart a job by referencing the job file',
    builder (yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-ignore
        yargs.example('$0 tjm restart jobFile.json');
        return yargs;
    },
    async handler(argv) {
        const job = new JobSrc(argv);
        job.init();
        const client = getTerasliceClient(job);
        const tjmUtil = new TjmUtil(client, job);
        await tjmUtil.stop();
        await tjmUtil.start();
    }
} as CMD;
