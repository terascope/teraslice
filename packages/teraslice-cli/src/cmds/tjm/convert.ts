import { unset } from '@terascope/utils';
import JobSrc from '../../helpers/job-src.js';
import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'convert <job-file>',
    describe: 'Converts job files that used the previous version of tjm to be compatable with teraslice-cli\n',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-expect-error
        yargs.example('$0 tjm convert jobFile.json');
        return yargs;
    },
    async handler(argv) {
        const job = new JobSrc(argv);
        job.readFile();
        const jobId = job.content.tjm.job_id;
        const { cluster } = job.content.tjm;
        job.addMetaData(jobId, cluster);
        unset(job.content, 'tjm');
        job.overwrite();
        reply.green(`Converted ${argv.jobFile} to be compatable with all teraslice-cli tjm commands`);
    }
} as CMD;
