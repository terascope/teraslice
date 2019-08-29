import JobSrc from '../../helpers/job-src';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import Reply from '../lib/reply';

const reply = new Reply();
const yargsOptions = new YargsOptions();

export = {
    command: 'init <job-file>',
    describe: 'Create a new job file with example job definitions',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-ignore
        yargs.example('$0 tjm init newJob.json');
        return yargs;
    },
    async handler(argv) {
        const job = new JobSrc(argv);
        job.content = {
            name: 'data-generator',
            lifecycle: 'persistent',
            workers: 3,
            operations: [
                {
                    _op: 'elasticsearch_data_generator',
                    size: 5000
                },
                {
                    _op: 'elasticsearch_index_selector',
                    index: 'example-logs',
                    type: 'events'
                },
                {
                    _op: 'elasticsearch_bulk',
                    size: 5000,
                    connection: 'default'
                }]
        };
        job.validateJob();
        job.overwrite();
        reply.green(`Created ${argv.jobFile} file at ${job.jobPath}`);
    }
} as CMD;
