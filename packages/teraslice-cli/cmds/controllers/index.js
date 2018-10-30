'use strict';

exports.command = 'controllers <command>';
exports.desc = 'commands to manage controller';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.')
        .demandCommand(2);
};
exports.handler = () => {};
