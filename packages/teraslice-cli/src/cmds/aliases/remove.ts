
import { CMD } from '../../interfaces';
import Reply from '../lib/reply';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';

const reply = new Reply();
const yargsOptions = new YargsOptions();

export = {
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
            cliConfig.aliases.remove(cliConfig.args.clusterAlias);
            if (cliConfig.args.list) {
                cliConfig.aliases.list(cliConfig.args.output);
            }
            reply.green(`> Removed alias ${cliConfig.args.clusterAlias}`);
        } catch (e) {
            reply.error(`error removing alias ${e}`);
        }
    }
} as CMD;
