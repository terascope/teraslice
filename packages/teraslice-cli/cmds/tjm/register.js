'use strict';

const _ = require('lodash');
const reply = require('../lib/reply')();
const Config = require('../../lib/config');
const JobSrc = require('../../lib/job-src');
const { getTerasliceClient } = require('../../lib/utils');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'register <cluster-alias> <job-name>';
exports.desc = 'Register a job to a cluster from a job file';
exports.aliases = ['reg'];
exports.builder = (yargs) => {
    yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
    yargs.positional('job-name', yargsOptions.buildPositional('job-name'));
    yargs.option('start', yargsOptions.buildOption('start'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm register localhost new-job.json');
    yargs.example('$0 tjm register localhost new-job.json --start');
    yargs.example('$0 tjm reg localhost new-job.json --start');
};

exports.handler = async (argv) => {
    const cliConfig = new Config(argv);
    const job = new JobSrc(cliConfig.args.srcDir, cliConfig.args.file);
    const terasliceClient = getTerasliceClient(cliConfig);

    if (job.hasMetaData) {
        const regCluster = _.get(job.content, '__metadata.cli.cluster');
        reply.fatal(`job has already been registered on ${regCluster}`);
    }

    const registeredResponse = await terasliceClient.jobs
        .submit(job.content, !cliConfig.args.start);

    const jobId = registeredResponse.id();

    if (registeredResponse) {
        reply.green(`Successfully registered job: ${jobId} on ${cliConfig.clusterUrl}`);
        if (cliConfig.args.start) reply.green(`Job: ${jobId} is queued to start`);
    } else {
        reply.fatal('Job failed to register');
    }

    job.addMetaData(jobId, cliConfig.clusterUrl);
    job.overwrite();
};
