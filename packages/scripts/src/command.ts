import yargs from 'yargs';

yargs
    .usage('Usage: $0 <command> [options]')
    .commandDir('cmds')
    .demandCommand(1, 'A command is required. Pass --help to see all available commands and options.')
    .recommendCommands()
    .strict()
    .showHelpOnFail(false, 'Specify --help for available options')
    .alias('h', 'help')
    .alias('v', 'version')
    .wrap(yargs.terminalWidth()).argv;
