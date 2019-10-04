import yargs from 'yargs';
import aliases from './cmds/aliases';
import assets from './cmds/assets';
import jobs from './cmds/jobs';
import ex from './cmds/ex';
import nodes from './cmds/nodes';
import workers from './cmds/workers';
import controllers from './cmds/controllers';
import tjm from './cmds/tjm';

// eslint-disable-next-line
yargs
    .command(aliases)
    .command(assets)
    .command(jobs)
    .command(ex)
    .command(nodes)
    .command(workers)
    .command(controllers)
    .command(tjm)
    .demandCommand(1, 'A command is required. Pass --help to see all available commands and options.')
    .recommendCommands()
    .strict()
    .alias('h', 'help')
    .alias('v', 'version')
    .wrap(yargs.terminalWidth()).argv;
