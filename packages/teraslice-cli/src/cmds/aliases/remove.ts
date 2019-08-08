
import { CMD } from '../../interfaces';

import replyModule from '../lib/reply';
import Config from '../../lib/config';
import YargsOptions from '../../lib/yargs-options';

const reply = new replyModule();
const yargsOptions = new YargsOptions();

export default {
    command: 'remove  <cluster-alias>',
    describe: 'List the clusters defined in the config file.\n',
    exclude: 'lib',
    builder(yargs) {
        yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('list', yargsOptions.buildOption('list'));
        // @ts-ignore
        yargs.example('$0 aliases remove cluster1');
        return yargs;
    },
    handler(argv) {
        const cliConfig = new Config(argv);

        try {
            // @ts-ignore
            cliConfig.aliases.remove(cliConfig.args.clusterAlias);
            // @ts-ignore
            if (cliConfig.args.list) {
                // @ts-ignore
                cliConfig.aliases.list(cliConfig.args.output);
            }
            // @ts-ignore
            reply.green(`> Removed alias ${cliConfig.args.clusterAlias}`);
        } catch (e) {
            reply.error(`error removing alias ${e}`);
        }
    }
} as CMD;
