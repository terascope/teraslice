import { CMD } from '../../interfaces.js';

import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';
import { generateRegistry } from '../../generators/registry/index.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'registry',
    describe: 'Creates or updates a registry for an asset bundle at `assets/index.js` or `assets/src/index.ts`',
    builder(yargs) {
        yargs.option('base-dir', yargsOptions.buildOption('base-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.example(
            '$0 asset registry',
            'Add or update registry on existing asset'
        );
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);
        const assetBaseDir = cliConfig.args.baseDir;

        try {
            await generateRegistry(assetBaseDir);
        } catch (e) {
            reply.fatal(e);
        }

        reply.green('All done!');
    }
} as CMD;
