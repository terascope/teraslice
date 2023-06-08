import JobSrc from '../../helpers/job-src';
import Config from '../../helpers/config';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import reply from '../../helpers/reply';
import Jobs from '../../helpers/jobs';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'workers <action> <number> <job-file>',
    describe: 'Add workers to a job',
    builder(yargs) {
        yargs.positional('action', yargsOptions.buildPositional('worker-action'));
        yargs.positional('number', yargsOptions.buildPositional('worker-number'));
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.example('$0 tjm workers add 10 jobFile.json', 'add 10 workers to a job')
            .example('$0 tjm workers remove 10 jobFile.json', 'remove 10 workers to a job')
            .example('$0 tjm workers total 40 jobFile.json', 'set the total number of workers for a job to 40');

        return yargs;
    },
    async handler(argv): Promise <void> {
        const job = new JobSrc(argv);

        job.init();

        const cliConfig = new Config({ ...job, ...argv });

        const jobs = new Jobs(cliConfig);

        try {
            const resp = await jobs.workers();

            reply.green(`${resp}, job_id: ${job.id}, cluster: ${job.clusterUrl}`);
        } catch (e) {
            reply.fatal(`could not adjust workers for job: ${job.id}, ${e.message}`);
        }
    }
};

export = cmd;
