'use strict';

const reply = require('../lib/reply')();
const Config = require('../../lib/config');
const Jobs = require('../../lib/jobs');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'workers <cluster-alias> <id> <action> <num>';
exports.desc = 'Manage workers in job\n';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.strict()
        .choices('action', ['add', 'remove'])
        .example('$0 jobs workers cluster1 99999999-9999-9999-9999-999999999999 add 5')
        .example('$0 jobs workers cluster1 99999999-9999-9999-9999-999999999999 remove 5');
};

exports.handler = async (argv) => {
    const cliConfig = new Config(argv);
    const jobs = new Jobs(cliConfig);

    try {
        await jobs.workers();
    } catch (e) {
        reply.fatal(e);
    }
};
