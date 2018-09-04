'use strict';

exports.command = 'job <command>';
exports.desc = 'Commands to manage a job';
exports.builder = function (yargs) {
    return yargs.commandDir('job');
};
exports.handler = argv => {};
