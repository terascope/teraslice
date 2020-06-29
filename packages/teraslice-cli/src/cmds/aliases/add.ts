import { CMD } from '../../interfaces';
import reply from '../../helpers/reply';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';

const yargsOptions = new YargsOptions();

export = {
    command: 'add <new-cluster-alias> <new-cluster-url>',
    describe: 'Add an alias to the clusters defined in the config file.\n',
    builder(yargs) {
        yargs.positional('new-cluster-alias', yargsOptions.buildPositional('new-cluster-alias'));
        yargs.positional('new-cluster-url', yargsOptions.buildPositional('new-cluster-url'));
        yargs.coerce('new-cluster-url', yargsOptions.buildCoerce('new-cluster-url'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('list', yargsOptions.buildOption('list'));
        yargs.example('$0 aliases add cluster1 http://cluster1.net:80', 'Add an alias to the cluster');
        return yargs;
    },
    handler(argv) {
        const cliConfig = new Config(argv);
        try {
            cliConfig.aliases.add(
                cliConfig.args.newClusterAlias,
                cliConfig.args.newClusterUrl
            );
            if (cliConfig.args.list) {
                cliConfig.aliases.list(cliConfig.args.output);
            }
            reply.green(`> Added alias ${cliConfig.args.newClusterAlias} host: ${cliConfig.args.newClusterUrl}`);
        } catch (e) {
            reply.error(`error adding alias ${e}`);
        }
    }
} as CMD;
