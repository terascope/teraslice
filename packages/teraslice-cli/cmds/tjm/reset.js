'use strict';

const _ = require('lodash');
const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const reply = require('../lib/reply')();

const yargsOptions = new YargsOptions();

exports.command = 'reset <job-file>';
exports.desc = 'Reset a job file by removing the cli metadata';
exports.builder = (yargs) => {
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm start new-job.json');
    yargs.example('$0 tjm run new-job.json');
};

exports.handler = async (argv) => {
    const job = new JobSrc(argv.srcDir, argv.jobName);
    _.unset(job.content, '__metadata');
    job.overwrite();
    reply.green(`Removed metadata from ${argv.jobFile}`);
};
