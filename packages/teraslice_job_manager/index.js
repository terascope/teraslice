#! /usr/bin/env node

/* eslint-disable no-console, no-unused-vars */

'use strict';

const argv = require('yargs')
    .commandDir('cmds')
    .demandCommand()
    .help('help')
    .alias('help', 'h')
    .version(false)
    .strict()
    .argv;

process.on('unhandledRejection', (error) => {
    console.error('UnhandledRejection: ', error.stack);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('UncaughtException: ', error.stack);
    process.exit(1);
});
