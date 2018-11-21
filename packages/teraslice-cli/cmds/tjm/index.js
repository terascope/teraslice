'use strict';

exports.command = 'tjm <command> <job_file>';
exports.desc = 'Commands to manage job files on a teraslice cluster';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.')
        .demandCommand(2);
};
exports.handler = () => {};
