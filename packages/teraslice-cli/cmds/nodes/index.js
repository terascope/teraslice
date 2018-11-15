'use strict';

exports.command = 'nodes <command>';
exports.desc = 'commands to list nodes';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.')
        .demandCommand(2);
};
exports.handler = () => {};
