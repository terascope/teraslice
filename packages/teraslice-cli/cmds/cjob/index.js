'use strict';

exports.command = 'cjob <command>';
exports.desc = 'commands to manage job';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.');
};
exports.handler = () => {};
