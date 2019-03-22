'use strict';

const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const Client = require('../../lib/utils').getTerasliceClient;
const TjmUtil = require('../../lib/tjm-util');

const yargsOptions = new YargsOptions();

exports.command = 'stop <job-file>';
exports.desc = 'Stop a job by referencing the job file';
exports.builder = (yargs) => {
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm stop jobFile.json');
};

exports.handler = async (argv) => {
    const job = new JobSrc(argv);
    job.init();
    const client = Client(job);
    const tjmUtil = new TjmUtil(client, job);
    await tjmUtil.stop();
};
