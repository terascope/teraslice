
import _ from 'lodash';
import TjmUtil from '../../helpers/tjm-util';
import JobSrc from '../../helpers/job-src';
import { CMD } from '../../interfaces';
import YargsOptions from '../../helpers/yargs-options';
import { getTerasliceClient } from '../../helpers/utils';
import Reply from '../lib/reply';

const reply = new Reply();
const yargsOptions = new YargsOptions();

export = {
    command: 'update <job-file>',
    describe: 'Update a job by referencing the job file',
    builder(yargs) {
        yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
        yargs.option('start', yargsOptions.buildOption('start'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-ignore
        yargs.example('$0 tjm update jobFile.json');
        return yargs;
    },
    async handler(argv) {
        const job = new JobSrc(argv);
        job.init();

        const client = getTerasliceClient(job);

        const jobJson = job.content;

        // remove metadata from the jobJson before sending it to the cluster
        _.unset(jobJson, '__metadata');

        try {
            const update = await client.cluster.put(`/jobs/${job.jobId}`, jobJson);
            // @ts-ignore TODO: review this
            if (!_.get(update, 'job_id') === job.job_id) {
                reply.fatal(`Could not be updated job ${job.jobId} on ${job.clusterUrl}`);
            }
        } catch (e) {
            reply.fatal(e.message);
        }

        job.addMetaData(job.jobId, job.clusterUrl);
        job.overwrite();
        reply.green(`Updated job ${job.jobId} config on ${job.clusterUrl}`);

        try {
            const view = await client.jobs.wrap(job.jobId).config();
            reply.yellow(`${job.name} on ${job.clusterUrl}:`);
            reply.green(JSON.stringify(view, null, 4));
        } catch (e) {
            reply.fatal(e.message);
        }

        if (argv.start) {
            const tjmUtil = new TjmUtil(client, job);
            await tjmUtil.stop();
            await tjmUtil.start();
        }
    }
} as CMD;
