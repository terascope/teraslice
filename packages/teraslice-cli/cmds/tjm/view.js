'use strict';

const TjmCommands = require('../../lib/tjm-commands');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'view <job-name>';
exports.desc = 'View a job as it is saved on the cluster by referencing the job file';
exports.builder = (yargs) => {
    yargs.positional('job-name', yargsOptions.buildPositional('job-name'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm view jobName.json');
};

exports.handler = async (argv) => {
    const tjmCommands = new TjmCommands(argv);
    tjmCommands.view();
};
