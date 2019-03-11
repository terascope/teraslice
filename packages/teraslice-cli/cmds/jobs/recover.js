'use strict';
'use console';

const reply = require('../lib/reply')();
const Config = require('../../lib/config');
const Jobs = require('../../lib/jobs');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();


exports.command = 'recover <cluster-alias> <id>';
exports.desc = 'Run recovery on cluster for specified job id.\n';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.options('output', yargsOptions.buildOption('output'));
    yargs.strict()
        .example('$0 jobs recover cluster1 99999999-9999-9999-9999-999999999999');
};

exports.handler = async (argv) => {
    const cliConfig = new Config(argv);
    const jobs = new Jobs(cliConfig);
    try {
        await jobs.recover();
    } catch (e) {
        reply.fatal(e);
    }
};
