'use strict';

const _ = require('lodash');
const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const Client = require('../../lib/utils').getTerasliceClient;
const reply = require('../lib/reply')();

const yargsOptions = new YargsOptions();

exports.command = 'update <job-file>';
exports.desc = 'Update a job by referencing the job file';
exports.builder = (yargs) => {
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('start', yargsOptions.buildOption('start'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm update jobFile.json');
};

exports.handler = async (argv) => {
    const job = new JobSrc(argv);
    job.init();
    const client = Client(job);
    const jobJson = job.content;
    _.unset(jobJson, '__metadata');
    try {
        const update = await client.cluster.put(`/jobs/${job.jobId}`, jobJson);
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

    if (argv.start) {
        await stop();
        await start();
    }
};
