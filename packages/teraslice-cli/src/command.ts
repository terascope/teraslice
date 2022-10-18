import yargs from 'yargs';
import aliases from './cmds/aliases.js';
import assets from './cmds/assets.js';
import jobs from './cmds/jobs.js';
import ex from './cmds/ex.js';
import nodes from './cmds/nodes.js';
import workers from './cmds/workers.js';
import controllers from './cmds/controllers.js';
import tjm from './cmds/tjm.js';

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
