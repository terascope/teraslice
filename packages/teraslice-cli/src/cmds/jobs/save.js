'use strict';

const reply = require('../lib/reply')();
const Config = require('../../lib/config');
const Jobs = require('../../lib/jobs');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'save <cluster-alias>';
exports.desc = 'Saves all running job on the specified cluster to a json file.\n';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.options('status', yargsOptions.buildOption('jobs-status'));
    yargs.strict()
        .example('$0 jobs save cluster1');
};

exports.handler = async (argv) => {
    const cliConfig = new Config(argv);
    const jobs = new Jobs(cliConfig);

    try {
        await jobs.save();
    } catch (e) {
        reply.fatal(e);
    }
};
