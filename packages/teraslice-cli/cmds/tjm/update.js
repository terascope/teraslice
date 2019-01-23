'use strict';

const _ = require('lodash');
const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const Client = require('../../lib/utils').getTerasliceClientByCluster;
const reply = require('../lib/reply')();

const yargsOptions = new YargsOptions();

exports.command = 'update <job-file>';
exports.desc = 'Update a job by referencing the job file';
exports.builder = (yargs) => {
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('start', yargsOptions.buildOption('start'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm start job-file.json');
    yargs.example('$0 tjm run job-file.json');
};

exports.handler = async (argv) => {
    const job = new JobSrc(argv);
    job.init();
    const client = Client(job.cluster);

    try {
        const update = await client.cluster.put(`/jobs/${job.jobId}`, job.job.content);
        if (!_.get(update, 'job_id') === job.job_id) {
            reply.fatal(`Could not be updated job ${job.jobId} on ${job.cluster}`);
        }
    } catch (e) {
        reply.fatal(e.message);
    }

    job.addMetaData(job.jobId, job.cluster);
    job.overwrite();
    reply.green(`Updated job ${job.jobId} config on ${job.cluster}`);

    try {
        const view = await client.jobs.wrap(job.jobId).config();
        reply.yellow(`${job.name} on ${job.cluster}:`);
        reply.green(JSON.stringify(view, null, 4));
    } catch (e) {
        reply.fatal(e.message);
    }

    if (argv.start) {
        try {
            const stop = await client.jobs.wrap(job.jobId).stop();
            if (!stop.status.status === 'stopped') {
                reply.fatal(`Could not be stop ${job.name} on ${job.cluster}`);
            }
            reply.green(`Stopped job ${job.name} on ${job.cluster}`);

            const start = await client.jobs.wrap(job.jobId).start();
            if (!start.job_id === job.jobId) {
                reply.fatal(`Could not start ${job.name} on ${job.cluster}`);
            }
            reply.green(`Started ${job.name} on ${job.cluster}`);
        } catch (e) {
            if (e.message.includes('no execution context was found')) {
                reply.fatal(`Job ${job.name} is not currently running on ${job.cluster}`);
            }
            reply.fatal(e.message);
        }
    }
};
