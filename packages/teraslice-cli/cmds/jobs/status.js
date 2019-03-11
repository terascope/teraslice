'use strict';

const reply = require('../lib/reply')();
const Config = require('../../lib/config');
const Jobs = require('../../lib/jobs');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'status <cluster-alias>';
exports.desc = 'List the job status of running and failing job.\n';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.options('status', yargsOptions.buildOption('jobs-status'));
    yargs.strict()
        .example('$0 jobs status cluster1')
        .example('$0 jobs status cluster1 --status=failed');
};

exports.handler = async (argv) => {
    const cliConfig = new Config(argv);
    const jobs = new Jobs(cliConfig);

    try {
        await jobs.status();
    } catch (e) {
        reply.fatal(e);
    }
};
