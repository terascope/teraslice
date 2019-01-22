'use strict';

const TjmCommands = require('../../lib/tjm-commands');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'stop <job-name>';
exports.desc = 'Stop a job by referencing the job file';
exports.builder = (yargs) => {
    yargs.positional('job-name', yargsOptions.buildPositional('job-name'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm stop new-job.json');
};

exports.handler = async (argv) => {
    const tjmCommands = new TjmCommands(argv);
    tjmCommands.stop();
};
