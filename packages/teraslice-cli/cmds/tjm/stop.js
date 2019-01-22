'use strict';

const reply = require('../lib/reply')();
const JobSrc = require('../../lib/job-src');
const Config = require('../../lib/config');
const { getTerasliceClient } = require('../../lib/utils');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'stop <file>';
exports.desc = 'Stop a job by referencing the job file';
exports.builder = (yargs) => {
    yargs.positional('job-name', yargsOptions.buildPositional('job-name'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm stop new-job.json');
};

exports.handler = async (argv) => {
    const job = new JobSrc(argv.srcDir, argv.file);

    if (!job.hasMetaData) {
        reply.fatal('Job file does not contain cli data, register the job first');
    }

    const jobId = job.content.__metadata.cli.job_id;
    const { cluster } = job.content.__metadata.cli;
    argv.clusterUrl = cluster;
    const cliConfig = new Config(argv);

    const terasliceClient = getTerasliceClient(cliConfig);

    let clientResponse;
    try {
        clientResponse = await terasliceClient.jobs.wrap(jobId).stop();
    } catch (e) {
        if (e.message.includes('no execution context was found')) {
            reply.fatal(`Job ${jobId} is not currently running on ${cluster}`);
        }
        reply.fatal(e);
    }

    // confirm that job is stopped
    if (!clientResponse.status.status === 'stopped') {
        reply.fatal('Job could not be stopped');
    }
    reply.green(`Stopped job ${jobId} on ${cluster}`);
};
