'use strict';

exports.command = 'cluster <command>';
exports.desc = 'commands to manage cluster';
exports.exclude = 'lib';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.');
};
exports.handler = () => {};
