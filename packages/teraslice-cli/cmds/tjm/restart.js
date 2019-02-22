'use strict';

const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const Client = require('../../lib/utils').getTerasliceClient;
const reply = require('../lib/reply')();

const yargsOptions = new YargsOptions();

exports.command = 'restart <job-file>';
exports.desc = 'Restart a job by referencing the job file';
exports.builder = (yargs) => {
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm restart jobFile.json');
};

exports.handler = async (argv) => {
    const job = new JobSrc(argv);
    job.init();
    const client = Client(job);

    async function stop() {
        try {
            const stopResult = await client.jobs.wrap(job.jobId).stop();
            if (!stopResult.status.status === 'stopped') {
                reply.fatal(`Could not be stop ${job.name} on ${job.clusterUrl}`);
            }
            reply.green(`Stopped job ${job.name} on ${job.clusterUrl}`);
        } catch (e) {
            if (e.message.includes('no execution context was found')) {
                reply.yellow(`Job ${job.name} is not currently running on ${job.clusterUrl}, will now attempt to start the job`);
            }
            if (e.message.includes('Cannot update terminal job status of "stopped" to "stopping"')) {
                reply.green(`Job ${job.name} on ${job.clusterUrl} is already stopped`);
                return;
            }
            reply.fatal(e.message);
        }
    }
    async function start() {
        try {
            const startResult = await client.jobs.wrap(job.jobId).start();
            if (!startResult.job_id === job.jobId) {
                reply.fatal(`Could not start ${job.name} on ${job.clusterUrl}`);
            }
            reply.green(`Started ${job.name} on ${job.clusterUrl}`);
        } catch (e) {
            reply.fatal(e.message);
        }
    }
    await stop();
    await start();
};
