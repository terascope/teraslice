
'use strict';

const reply = require('../lib/reply')();
const Config = require('../../lib/config');
const Jobs = require('../../lib/jobs');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'run <cluster-alias> [id]';
exports.desc = 'run job specified by id \n';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.options('status', yargsOptions.buildOption('jobs-status'));
    yargs.options('all', yargsOptions.buildOption('jobs-all'));
    yargs.options('yes', yargsOptions.buildOption('yes'));
    yargs.strict()
        .example('$0 jobs run cluster1 99999999-9999-9999-9999-999999999999')
        .example('$0 jobs run cluster1 99999999-9999-9999-9999-999999999999 --yes')
        .example('$0 jobs run cluster1 --all');
};

exports.handler = async (argv) => {
    const cliConfig = new Config(argv);
    const jobs = new Jobs(cliConfig);

    try {
        await jobs.run();
    } catch (e) {
        reply.fatal(e);
    }
};
