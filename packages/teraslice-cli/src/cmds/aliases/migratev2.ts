import { CMD } from '../../interfaces.js';
import reply from '../../helpers/reply.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import { detectApiVersion } from '../../helpers/utils.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'migratev2 <cluster-alias>',
    describe: 'Switch an alias to the /v2 API if the cluster supports it.\n',
    exclude: 'lib',
    builder(yargs) {
        yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('list', yargsOptions.buildOption('list'));
        yargs.example('$0 aliases migratev2 cluster1', 'Use the /v2 API for cluster1');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);
        const { clusterAlias } = cliConfig.args;

        if (cliConfig.apiVersion === 'v2') {
            reply.green(`> Alias ${clusterAlias} already uses apiVersion v2`);
            return;
        }

        const { apiVersion, reason } = await detectApiVersion(cliConfig.clusterUrl);
        if (apiVersion !== 'v2') {
            reply.fatal(`Unable to migrate alias ${clusterAlias} to apiVersion v2 because ${reason}. It will stay on v1.`);
        }

        cliConfig.aliases.setApiVersion(clusterAlias, 'v2');
        if (cliConfig.args.list) {
            cliConfig.aliases.list(cliConfig.args.output);
        }
        reply.green(`> Migrated alias ${clusterAlias} to apiVersion v2`);
    }
} as CMD;
