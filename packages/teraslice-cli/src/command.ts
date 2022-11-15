import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'
import aliases from './cmds/aliases/index.js';
import assets from './cmds/assets/index.js';
import jobs from './cmds/jobs/index.js';
import ex from './cmds/ex/index.js';
import nodes from './cmds/nodes/index.js';
import workers from './cmds/workers/index.js';
import controllers from './cmds/controllers/index.js';
import tjm from './cmds/tjm/index.js';


const y = yargs(hideBin(process.argv))

y
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
    .wrap(y.terminalWidth()).argv;
