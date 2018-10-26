'use strict';

exports.command = 'aliases <command>';
exports.desc = 'commands to add and remove cluster aliases';
exports.exclude = 'lib';
exports.builder = function builder(yargs) {
    return yargs.strict()
        .commandDir('.')
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
