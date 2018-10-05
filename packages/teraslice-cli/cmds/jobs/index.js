'use strict';

exports.command = 'jobs <command>';
exports.desc = 'commands to manage job';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.');
};
exports.handler = () => {};
