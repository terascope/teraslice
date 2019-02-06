import yargs from 'yargs';
import mkdocs from './commands/mkdocs';

yargs
    .command(mkdocs)
    .version()
    .alias('v', 'version')
    .help()
    .alias('h', 'help')
    .detectLocale(false)
    .wrap(yargs.terminalWidth())
    .argv;
