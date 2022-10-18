import JobSrc from '../../helpers/job-src.js';
import { CMD } from '../../interfaces.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'init <job-file>',
    describe: 'Create a new job file with example job definitions',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-expect-error
        yargs.example('$0 tjm init newJob.json');
        return yargs;
    },
    async handler(argv) {
        const job = new JobSrc(argv);
        job.content = {
            name: 'data-generator',
            lifecycle: 'persistent',
            workers: 3,
            assets: ['elasticsearch', 'standard'],
            operations: [
                {
                    _op: 'data_generator',
                    size: 5000
                },
                {
                    _op: 'elasticsearch_bulk',
                    size: 5000,
                    index: 'example-logs',
                    type: 'events'
                }
            ]
        };
        job.validateJob();
        job.overwrite();
        reply.green(`Created ${argv.jobFile} file at ${job.jobPath}`);
    }
} as CMD;
