'use strict';

const _ = require('lodash');
const reply = require('../lib/reply')();
const Config = require('../../lib/config');
const JobSrc = require('../../lib/job-src');
const { getTerasliceClient } = require('../../lib/utils');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'register <cluster-alias> <job-file>';
exports.desc = 'Register a job to a cluster from a job file';
exports.aliases = ['reg'];
exports.builder = (yargs) => {
    yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('start', yargsOptions.buildOption('start'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm register localhost new-job.json');
    yargs.example('$0 tjm register localhost new-job.json --start');
    yargs.example('$0 tjm reg localhost new-job.json --start');
};

exports.handler = async (argv) => {
    const cliConfig = new Config(argv);
    const job = new JobSrc(argv);
    const terasliceClient = getTerasliceClient(cliConfig);

    if (job.hasMetaData) {
        const regCluster = _.get(job.content, '__metadata.cli.cluster');
        reply.fatal(`job has already been registered on ${regCluster}`);
    }
    job.readFile();
    job.validateJob();
    try {
        const registeredResponse = await terasliceClient.jobs
            .submit(job.content, !cliConfig.args.start);

        const jobId = registeredResponse.id();

        if (registeredResponse) {
            reply.green(`Successfully registered ${job.content.name} on ${cliConfig.clusterUrl} with job id ${jobId}`);
            if (cliConfig.args.start) reply.green(`${job.content.name} is queued to start`);
        } else {
            reply.fatal(`Failed to register ${job.content.name} on ${cliConfig.clusterUrl}`);
        }

        job.addMetaData(jobId, cliConfig.clusterUrl);
        job.overwrite();
    } catch (e) {
        reply.fatal(e.message);
    }
};
