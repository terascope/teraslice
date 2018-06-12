#! /usr/bin/env node

'use strict';

require('yargs')
    .commandDir('cmds')
    .demandCommand()
    .help('help')
    .alias('help', 'h')
    .version(false)
    .strict();

process.on('unhandledRejection', (error) => {
    console.error('UnhandledRejection: ', error.stack); // eslint-disable-line no-console
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('UncaughtException: ', error.stack); // eslint-disable-line no-console
    process.exit(1);
});
