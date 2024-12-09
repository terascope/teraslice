import yargs from 'yargs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { hideBin } from 'yargs/helpers';
import aliases from './cmds/aliases/index.js';
import assets from './cmds/assets/index.js';
import jobs from './cmds/jobs/index.js';
import ex from './cmds/ex/index.js';
import nodes from './cmds/nodes/index.js';
import workers from './cmds/workers/index.js';
import controllers from './cmds/controllers/index.js';
import tjm from './cmds/tjm/index.js';

/// Grab package.json version for yargs
const dirPath = fileURLToPath(new URL('.', import.meta.url));
const packageJsonPath = path.join(dirPath, '../../package.json');
let version: string;
try {
    version = JSON.parse(readFileSync(packageJsonPath, { encoding: 'utf-8' })).version;
} catch {
    version = 'unknown';
}

const yargsInstance = yargs(hideBin(process.argv));
yargsInstance.version(version);
// eslint-disable-next-line
yargsInstance.command(aliases)
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
    .wrap(yargsInstance.terminalWidth()).argv;
