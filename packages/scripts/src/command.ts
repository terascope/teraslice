import yargs from 'yargs';

yargs
    .usage('Usage: $0 <command> [options]')
    .commandDir('cmds')
    .demandCommand(1, 'A command is required. Pass --help to see all available commands and options.')
    .recommendCommands()
    .strict()
    .fail((msg, err) => {
        console.error(msg, err);
        yargs.exit(1, err);
    })
    .alias('h', 'help')
    .alias('v', 'version')
    .wrap(yargs.terminalWidth()).argv;
