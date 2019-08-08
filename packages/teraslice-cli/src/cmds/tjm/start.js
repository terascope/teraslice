'use strict';

const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const Client = require('../../lib/utils').getTerasliceClient;
const TjmUtil = require('../../lib/tjm-util');

const yargsOptions = new YargsOptions();

exports.command = 'start <job-file>';
exports.desc = 'Start a job by referencing the job file';
exports.aliases = ['run'];
exports.builder = (yargs) => {
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm start jobFile.json');
    yargs.example('$0 tjm run jobFile.json');
};

exports.handler = async (argv) => {
    const job = new JobSrc(argv);
    job.init();
    const client = Client(job);
    const tjmUtil = new TjmUtil(client, job);
    await tjmUtil.start();
};
