'use strict';

exports.command = 'worker <command>';
exports.desc = 'commands to manage worker';
exports.exclude = 'lib';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.');
};
exports.handler = () => {};
