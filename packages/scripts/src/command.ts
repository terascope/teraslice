import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import commands from './cmds/index.js';

const y = yargs(hideBin(process.argv))

y
    .usage('Usage: $0 <command> [options]')
    .command(commands as any)
    .demandCommand(1, 'A command is required. Pass --help to see all available commands and options.')
    .recommendCommands()
    .strict()
    .alias('h', 'help')
    .alias('v', 'version')
    .wrap(y.terminalWidth()).argv;
