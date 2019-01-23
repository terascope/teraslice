'use strict';

const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const Client = require('../../lib/utils').getTerasliceClientByCluster;
const reply = require('../lib/reply')();

const yargsOptions = new YargsOptions();

exports.command = 'workers <worker-action> <number> <job-file>';
exports.desc = 'Add workers to a job';
exports.builder = (yargs) => {
    yargs.positional('worker-action', yargsOptions.buildPositional('worker-action'));
    yargs.positional('number', yargsOptions.buildPositional('number'));
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm workers add 10 jobName.json');
    yargs.example('$0 tjm workers remove 10 jobName.json');
    yargs.example('$0 tjm workers set 40 jobName.json');
};

exports.handler = async (argv) => {
    const job = new JobSrc(argv);
    job.init();
    const client = Client(job.cluster);

    try {
        const currentStatus = await client.jobs.wrap(job.jobId).status();
        if (currentStatus !== 'running') {
            reply.fatal(`${this.name} is currently ${currentStatus} and workers cannot be added`);
        }

        const workers = await client.jobs.wrap(job.jobId)
            .changeWorkers(argv.workerAction, argv.number);
        if (!workers) {
            reply.fatal(`Workers could not be added to ${this.name} on ${this.cluster}`);
        }
        reply.green(workers);
    } catch (e) {
        reply.fatal(e.message);
    }
};
