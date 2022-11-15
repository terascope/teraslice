import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import { CMD } from '../../interfaces.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'list',
    describe: 'List the clusters defined in the config file.\n',
    exclude: 'lib',
    builder(yargs) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.strict().example('$0 aliases list cluster1', 'List the clusters defined in the config file.');
        return yargs;
    },
    handler(argv) {
        const cliConfig = new Config(argv);
        return cliConfig.aliases.list(cliConfig.args.output);
    }
} as CMD;
