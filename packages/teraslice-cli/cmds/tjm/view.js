'use strict';

const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const Client = require('../../lib/utils').getTerasliceClientByCluster;
const reply = require('../lib/reply')();

const yargsOptions = new YargsOptions();

exports.command = 'view <job-file>';
exports.desc = 'View job as saved on the cluster by referencing the job file';
exports.builder = (yargs) => {
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm view job-file.json');
};

exports.handler = async (argv) => {
    const job = new JobSrc(argv);
    job.init();
    const client = Client(job.cluster);

    try {
        const response = await client.jobs.wrap(job.jobId).config();

        reply.yellow(`${job.name} on ${job.cluster}:`);
        reply.green(JSON.stringify(response, null, 4));
    } catch (e) {
        reply.fatal(e.message);
    }
};
