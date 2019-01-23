'use strict';

const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const Client = require('../../lib/utils').getTerasliceClient;
const reply = require('../lib/reply')();

const yargsOptions = new YargsOptions();

exports.command = 'start <job-file>';
exports.desc = 'Start a job by referencing the job file';
exports.aliases = ['run'];
exports.builder = (yargs) => {
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm start job-file.json');
    yargs.example('$0 tjm run job-file.json');
};

exports.handler = async (argv) => {
    const job = new JobSrc(argv);
    job.init();
    const client = Client(job);

    try {
        const response = await client.jobs.wrap(job.jobId).start();

        if (!response.job_id === job.jobId) {
            reply.fatal(`Could not start ${job.name} on ${job.clusterUrl}`);
        }

        reply.green(`Started ${job.name} on ${job.clusterUrl}`);
    } catch (e) {
        reply.fatal(e.message);
    }
};
