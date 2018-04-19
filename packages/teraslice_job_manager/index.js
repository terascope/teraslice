#! /usr/bin/env node

'use strict';


const argv = require('yargs')
    .commandDir('cmds')
    .demandCommand()
    .help('help')
    .alias('help', 'h')
    .version(false)
    .strict()
    .argv;
