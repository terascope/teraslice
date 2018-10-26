'use strict';

exports.command = 'ex <command> [cluster_sh]';
exports.desc = 'commands to manage execution ids';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.')
        .demandCommand(2);
};
exports.handler = () => {};
