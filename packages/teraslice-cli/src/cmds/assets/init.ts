import path from 'node:path';
import fs from 'fs-extra';
import yeoman from 'yeoman-environment';
import { CMD } from '../../interfaces.js';

import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';
import newProcessor from '../../generators/new-processor/index.js';
import newAsset from '../../generators/new-asset/index.js';
import registry from '../../generators/registry/index.js';

const yargsOptions = new YargsOptions();

const env = yeoman.createEnv();
env.registerStub(newProcessor as any, 'new-processor');
env.registerStub(newAsset as any, 'new-asset');
env.registerStub(registry as any, 'registry');

export default {
    command: 'init',
    describe: 'Creates a new asset bundle or asset processor.  If called without --processor it builds the whole asset in the current directory.  Used with the --processor it adds an asset to the ./asset dir',
    builder(yargs) {
        yargs.option('processor', yargsOptions.buildOption('processor'));
        yargs.option('base-dir', yargsOptions.buildOption('base-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.option('registry', yargsOptions.buildOption('registry'));
        yargs.example(
            '$0 asset init',
            'Generate new asset from template'
        );
        yargs.example(
            '$0 asset init --processor',
            'Add new processor to existing asset'
        );
        yargs.example(
            '$0 asset init --registry',
            'Add or update registry on existing asset'
        );
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);
        const assetBaseDir = cliConfig.args.baseDir;

        try {
            if (cliConfig.args.proc) {
                // FIXME: manually verify that this check behaves the same after my change here.
                // if just adding a new processor AssetBaseDir needs to have an asset dir
                if (!fs.pathExistsSync(path.join(assetBaseDir, 'asset'))) {
                    reply.fatal('Execute the command in the base directory of an asset or use the --base-dir with the asset\'s full path');
                }

                await env.run(`new-processor ${assetBaseDir} --new`);
            } else if (cliConfig.args.registry) {
                await env.run(`registry ${assetBaseDir}`);
            } else {
                await env.run(`new-asset ${assetBaseDir}`);
            }
        } catch (e) {
            reply.fatal(e);
        }

        reply.green('All done!');
    }
} as CMD;
