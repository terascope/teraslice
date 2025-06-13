import { CMD } from '../../interfaces.js';

import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';
import { generateRegistry } from '../../generators/registry/index.js';
import { updateReadmeOpList } from '../../helpers/readme.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'registry',
    describe: 'Creates or updates a registry for an asset bundle at `assets/index.js` or `assets/src/index.ts`\n',
    builder(yargs) {
        yargs.option('base-dir', yargsOptions.buildOption('base-dir'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.example(
            '$0 assets registry',
            'Add or update registry on existing asset'
        );
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);
        const assetBaseDir = cliConfig.args.baseDir;

        try {
            await generateRegistry(assetBaseDir);
            reply.green('Registry successfully updated');
            await updateReadmeOpList(assetBaseDir);
            reply.green('README APIS and Operations lists updated');
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
