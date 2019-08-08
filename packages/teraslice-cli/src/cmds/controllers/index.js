'use strict';

exports.command = 'controllers <command>';
exports.desc = 'commands to manage controller';
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
