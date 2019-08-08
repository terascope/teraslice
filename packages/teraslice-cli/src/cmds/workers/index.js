'use strict';

exports.command = 'workers <command>';
exports.desc = 'commands to manage worker';
exports.exclude = 'lib';
exports.builder = function builder(yargs) {
    return yargs.commandDir('.')
        .demandCommand(2);
};

exports.handler = () => {};

process.on('unhandledRejection', (error) => {
    console.error('UnhandledRejection: ', error.stack); // eslint-disable-line no-console
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('UncaughtException: ', error.stack); // eslint-disable-line no-console
    process.exit(1);
});
