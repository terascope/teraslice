'use strict';

exports.command = 'node <command>';
exports.desc = 'commands to list nodes';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.');
};
exports.handler = () => {};
