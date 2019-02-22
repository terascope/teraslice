'use strict';

const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const Client = require('../../lib/utils').getTerasliceClient;
const reply = require('../lib/reply')();

const yargsOptions = new YargsOptions();

exports.command = 'stop <job-file>';
exports.desc = 'Stop a job by referencing the job file';
exports.builder = (yargs) => {
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm stop jobFile.json');
};

exports.handler = async (argv) => {
    const job = new JobSrc(argv);
    job.init();
    const client = Client(job);
    try {
        const response = await client.jobs.wrap(this.job.jobId).stop();
        if (!response.status.status === 'stopped') {
            reply.fatal(`Could not be stop ${job.name} on ${job.clusterUrl}`);
        }
        reply.green(`Stopped job ${job.name} on ${job.clusterUrl}`);
    } catch (e) {
        if (e.message.includes('no execution context was found')) {
            reply.fatal(`Job ${job.name} is not currently running on ${job.clusterUrl}`);
        }
        if (e.message.includes('Cannot update terminal job status of "stopped" to "stopping"')) {
            reply.green(`Job ${job.name} on ${job.clusterUrl} is already stopped`);
            return;
        }
        reply.fatal(e);
    }
};
