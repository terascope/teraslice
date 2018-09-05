'use strict';

exports.command = 'job <command>';
exports.desc = 'Commands to manage a job';
exports.builder = function builder(yargs) {
    return yargs.commandDir('job');
};
exports.handler = () => {};
