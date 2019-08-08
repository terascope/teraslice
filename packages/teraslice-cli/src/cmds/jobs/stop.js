'use strict';

const reply = require('../lib/reply')();
const Config = require('../../lib/config');
const Jobs = require('../../lib/jobs');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'stop <cluster-alias> [id]';
exports.desc = 'stops job(s) running or failing on the cluster, saves running job(s) to a json file.\n';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.options('status', yargsOptions.buildOption('jobs-status'));
    yargs.options('all', yargsOptions.buildOption('jobs-all'));
    yargs.options('yes', yargsOptions.buildOption('yes'));
    yargs.strict()
        .example('$0 jobs stop cluster1 99999999-9999-9999-9999-999999999999')
        .example('$0 jobs stop cluster1 99999999-9999-9999-9999-999999999999 --yes')
        .example('$0 jobs stop cluster1 --all');
};

exports.handler = async (argv) => {
    const cliConfig = new Config(argv);
    const jobs = new Jobs(cliConfig);

    try {
        await jobs.stop();
    } catch (e) {
        reply.fatal(e);
    }
};
