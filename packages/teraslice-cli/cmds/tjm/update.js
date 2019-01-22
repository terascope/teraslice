'use strict';

const TjmCommands = require('../../lib/tjm-commands');
const YargsOptions = require('../../lib/yargs-options');
const reply = require('../../cmds/lib/reply')();

const yargsOptions = new YargsOptions();

exports.command = 'update <job-name>';
exports.desc = 'Update a job in the cluster by the job file';
exports.builder = (yargs) => {
    yargs.positional('job-name', yargsOptions.buildPositional('job-name'));
    yargs.option('start', yargsOptions.buildOption('start'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 tjm update new-job.json');
    yargs.example('$0 tjm update new-job.json --start');
};

exports.handler = async (argv) => {
    const tjmCommands = new TjmCommands(argv);
    await tjmCommands.update();
    if (argv.start) {
        reply.green('Ensuring that job is stopped');
        await tjmCommands.stop();
        await tjmCommands.start();
    }
};
