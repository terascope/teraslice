'use strict';

const JobSrc = require('../../lib/job-src');
const YargsOptions = require('../../lib/yargs-options');
const reply = require('../lib/reply')();

const yargsOptions = new YargsOptions();

exports.command = 'init <job-file>';
exports.desc = 'Create a new job file with example job definitions';
exports.builder = (yargs) => {
    yargs.positional('job-file', yargsOptions.buildPositional('job-file'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm init newJob.json');
};

exports.handler = (argv) => {
    const job = new JobSrc(argv);
    job.content = {
        name: 'data-generator',
        lifecycle: 'persistent',
        workers: 3,
        operations: [
            {
                _op: 'elasticsearch_data_generator',
                size: 5000
            },
            {
                _op: 'elasticsearch_index_selector',
                index: 'example-logs',
                type: 'events'
            },
            {
                _op: 'elasticsearch_bulk',
                size: 5000,
                connection: 'default'
            }]
    };
    job.validateJob();
    job.overwrite();
    reply.green(`Created ${argv.jobFile} file at ${job.jobPath}`);
};
