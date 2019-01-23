'use strict';

const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const Client = require('../../lib/utils').getTerasliceClient;
const reply = require('../lib/reply')();

const yargsOptions = new YargsOptions();

exports.command = 'status <job-file>';
exports.desc = 'View status of a job by referencing the job file';
exports.builder = (yargs) => {
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm errors job-file.json');
};

exports.handler = async (argv) => {
    const job = new JobSrc(argv);
    job.init();
    const client = Client(job);

    try {
        const response = await client.jobs.wrap(job.jobId).status();

        if (!response) {
            reply.fatal(`Could not get status for job ${job.name} on ${job.clusterUrl}`);
        }

        reply.green(`${job.name} is ${response} on ${job.clusterUrl}`);
    } catch (e) {
        reply.fatal(e.message);
    }
};
