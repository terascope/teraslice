'use strict';

const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const Client = require('../../lib/utils').getTerasliceClient;
const reply = require('../lib/reply')();

const yargsOptions = new YargsOptions();

exports.command = 'errors <job-file>';
exports.desc = 'View errors of a job by referencing the job file';
exports.builder = (yargs) => {
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm errors jobFile.json');
};

exports.handler = async (argv) => {
    const job = new JobSrc(argv);
    job.init();
    const client = Client(job);

    try {
        const response = await client.jobs.wrap(job.jobId).errors();

        if (response.length === 0) {
            reply.green(`No errors for ${job.name} on ${job.clusterUrl}`);
        } else {
            reply.yellow(`Errors for ${job.name} on ${job.clusterUrl}:\n`);
            response.forEach(error => reply.yellow(JSON.stringify(error, null, 4)));
        }
    } catch (e) {
        reply.fatal(e.message);
    }
};
