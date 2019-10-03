import yargs from 'yargs';

// eslint-disable-next-line no-unused-expressions
yargs
    .usage('Usage: $0 <command> [options]')
    .commandDir('cmds')
    .demandCommand(1, 'A command is required. Pass --help to see all available commands and options.')
    .recommendCommands()
    .strict()
    .alias('h', 'help')
    .alias('v', 'version')
    .wrap(yargs.terminalWidth()).argv;
