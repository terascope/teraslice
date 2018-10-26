'use strict';

exports.command = 'jobs <command> <cluster_sh> [job]';
exports.desc = 'commands to manage job';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.')
        .demandCommand(2);
};
exports.handler = () => {};
