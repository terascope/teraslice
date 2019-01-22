'use strict';

const TjmCommands = require('../../lib/tjm-commands');
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'workers <worker-action> <number> <job-name>';
exports.desc = 'Add workers to a job';
exports.builder = (yargs) => {
    yargs.positional('worker-action', yargsOptions.buildPositional('worker-action'));
    yargs.positional('number', yargsOptions.buildPositional('number'));
    yargs.positional('job-name', yargsOptions.buildPositional('job-name'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm workers add 10 jobName.json');
    yargs.example('$0 tjm workers remove 10 jobName.json');
    yargs.example('$0 tjm workers set 40 jobName.json');
};

exports.handler = async (argv) => {
    const tjmCommands = new TjmCommands(argv);
    tjmCommands.workers();
};
