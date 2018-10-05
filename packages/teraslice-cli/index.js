#! /usr/bin/env node

'use strict';

const { argv } = require('yargs') // eslint-disable-line no-unused-vars
    .command(require('./cmds/alias'))
    .command(require('./cmds/assets'))
    .command(require('./cmds/job'))
    .command(require('./cmds/jobs'))
    .command(require('./cmds/ex'))
    .command(require('./cmds/nodes'))
    .command(require('./cmds/workers'))
    .command(require('./cmds/controllers'))
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
