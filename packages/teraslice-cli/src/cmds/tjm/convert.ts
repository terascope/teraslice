import { unset } from '@terascope/utils';
import JobSrc from '../../helpers/job-src';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import Reply from '../lib/reply';

const reply = new Reply();

const yargsOptions = new YargsOptions();

export = {
    command: 'convert <job-file>',
    describe: 'Converts job files that used the previous version of tjm to be compatable with teraslice-cli\n',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-ignore
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
