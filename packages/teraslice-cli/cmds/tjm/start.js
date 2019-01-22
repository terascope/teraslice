'use strict';
'use console';

const reply = require('../lib/reply')();
const JobSrc = require('../../lib/job-src');
const Config = require('../../lib/config');
const { getTerasliceClient } = require('../../lib/utils');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'start <file>';
exports.desc = 'Start a job by referencing the job file';
exports.alias = ['run'];
exports.builder = (yargs) => {
    yargs.positional('job-name', yargsOptions.buildPositional('job-name'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm start new-job.json');
    yargs.example('$0 tjm run new-job.json');
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
        clientResponse = await terasliceClient.jobs.wrap(jobId).start();
    } catch (e) {
        reply.fatal(e);
    }

    if (clientResponse.job_id === jobId) {
        reply.green(`Job: ${jobId} started on ${cluster}`);
    } else {
        reply.fatal(`Job ${jobId} could not be started on ${cluster}`);
    }
};
