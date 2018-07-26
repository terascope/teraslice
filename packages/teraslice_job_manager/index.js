#! /usr/bin/env node

'use strict';

const { argv } = require('yargs') // eslint-disable-line no-unused-vars
    .commandDir('cmds')
    .demandCommand()
    .help('help')
    .alias('help', 'h')
    .version()
    .strict();

process.on('unhandledRejection', (error) => {
    console.error('UnhandledRejection: ', error.stack); // eslint-disable-line no-console
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('UncaughtException: ', error.stack); // eslint-disable-line no-console
    process.exit(1);
});
