'use strict';

exports.command = 'controller <command>';
exports.desc = 'commands to manage controller';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.');
};
exports.handler = () => {};
