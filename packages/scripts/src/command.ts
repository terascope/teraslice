import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import bumpAsset from './cmds/bump-asset.js';
import bump from './cmds/bump.js';
import docs from './cmds/docs.js';
import images from './cmds/images.js';
import k8sEnv from './cmds/k8s-env.js';
import publish from './cmds/publish.js';
import sync from './cmds/sync.js';
import test from './cmds/test.js';

const yargsInstance = yargs(hideBin(process.argv));

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
yargsInstance
    .usage('Usage: $0 <command> [options]')
    .command(bumpAsset)
    .command(bump)
    .command(docs)
    .command(images)
    .command(k8sEnv)
    .command(publish)
    .command(sync)
    .command(test)
    .demandCommand(1, 'A command is required. Pass --help to see all available commands and options.')
    .recommendCommands()
    .strict()
    .alias('h', 'help')
    .alias('v', 'version')
    .wrap(yargsInstance.terminalWidth()).argv;
