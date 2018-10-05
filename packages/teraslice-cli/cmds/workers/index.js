'use strict';

exports.command = 'workers <command>';
exports.desc = 'commands to manage worker';
exports.exclude = 'lib';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.');
};
exports.handler = () => {};
