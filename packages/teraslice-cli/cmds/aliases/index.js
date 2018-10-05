'use strict';

exports.command = 'aliases <command>';
exports.desc = 'commands to add and remove cluster aliases';
exports.exclude = 'lib';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.');
};
exports.handler = () => {};
