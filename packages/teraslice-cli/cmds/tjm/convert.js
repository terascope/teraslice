'use strict';

const _ = require('lodash');
const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const reply = require('../lib/reply')();

const yargsOptions = new YargsOptions();

exports.command = 'convert <job-file>';
exports.desc = 'Converts job files that used the previous version of tjm to be compatable with teraslice-cli';
exports.builder = (yargs) => {
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm convert jobFile.json');
};

exports.handler = async (argv) => {
    const job = new JobSrc(argv);
    job.readFile();
    const jobId = job.content.tjm.job_id;
    const { cluster } = job.content.tjm;
    job.addMetaData(jobId, cluster);
    _.unset(job.content, 'tjm');
    job.overwrite();
    reply.green(`Converted ${argv.jobFile} to be compatable with all teraslice-cli tjm commands`);
};
