'use strict';

const _ = require('lodash');
const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const Client = require('../../lib/utils').getTerasliceClient;
const TjmUtil = require('../../lib/tjm-util');
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

    // remove metadata from the jobJson before sending it to the cluster
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

    if (argv.start) {
        const tjmUtil = new TjmUtil(client, job);
        await tjmUtil.stop();
        await tjmUtil.start();
    }
};
