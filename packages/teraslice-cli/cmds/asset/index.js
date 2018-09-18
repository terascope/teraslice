'use strict';

exports.command = 'asset <command>';
exports.desc = 'commands to manage assets';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.')
        .option('baseDir', {
            describe: 'specify the base directory to use, defaults to cwd',
            default: process.cwd(),
            type: 'string'
        })
        .option('localhost', {
            alias: 'l',
            describe: 'short cut to localhost',
            default: false,
            type: 'boolean'
        });
};
exports.handler = () => {};
