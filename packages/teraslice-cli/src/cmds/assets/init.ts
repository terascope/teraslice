
import { CMD } from '../../interfaces';
import path from 'path';
import fs from 'fs-extra';
import yeoman from 'yeoman-environment';

import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Reply from '../lib/reply';
import newProcessor from '../../generators/new-processor';
import newAsset from '../../generators/new-asset';

const yargsOptions = new YargsOptions();
const reply = new Reply();

const env = yeoman.createEnv();
// @ts-ignore
env.registerStub(newProcessor, 'new-processor', path.join(
    __dirname, '../../generators/new-processor/index.js'
));
// @ts-ignore

env.registerStub(newAsset, 'new-asset', path.join(
    __dirname, '../../generators/new-asset/index.js'
));

export = {
    command: 'init',
    // tslint:disable-next-line:max-line-length
    describe: 'Creates a new asset bundle or asset processor.  If called without --processor it builds the whole asset in the current directory.  Used with the --processor it adds an asset to the ./asset dir',
    builder(yargs) {
        yargs.option('processor', yargsOptions.buildOption('processor'));
        yargs.option('base-dir', yargsOptions.buildOption('base-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        // @ts-ignore
        yargs.example('$0 asset init');
         // @ts-ignore
        yargs.example('$0 asset init --processor');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);
        const assetBaseDir = cliConfig.args.baseDir;

        // if just adding a new processor AssetBaseDir needs to have an asset dir
        if (argv.proc && !fs.pathExistsSync(path.join(assetBaseDir, 'asset'))) {
            reply.fatal('Execute the command in the base directory of an asset or use the --base-dir with the asset\'s full path');
        }

        try {
            if (argv.proc) {
                 // @ts-ignore
                await env.run(`new-processor ${assetBaseDir} --new`);
            } else {
                 // @ts-ignore
                await env.run(`new-asset ${assetBaseDir}`);
            }
            reply.green('All done!');
        } catch (e) {
            reply.fatal(e);
        }

        process.exit(0);
    }
} as CMD;
