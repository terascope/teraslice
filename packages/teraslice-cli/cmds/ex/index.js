'use strict';

exports.command = 'ex <command>';
exports.desc = 'commands to manage execution ids';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.');
};
exports.handler = () => {};
