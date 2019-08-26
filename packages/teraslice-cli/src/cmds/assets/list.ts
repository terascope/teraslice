
import { CMD } from '../../interfaces';
import Reply from '../lib/reply';
import Config from '../../lib/config';
import YargsOptions from '../../lib/yargs-options';
import { getTerasliceClient } from '../../lib/utils';
import displayModule from '../lib/display';

const display = displayModule();

const reply = new Reply();
const yargsOptions = new YargsOptions();

export default {
    command: 'list <cluster-alias>',
    describe: 'List assets on a cluster.\n',
    builder(yargs) {
        yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.option('output', yargsOptions.buildOption('output'));
        // @ts-ignore
        yargs.example('$0 assets list ts-test1');
        return yargs;
    },
    async handler(argv) {
        let response;
        const cliConfig = new Config(argv);
        const terasliceClient = getTerasliceClient(cliConfig);
        const header = ['name', 'version', 'id', 'description', '_created'];

        try {
            response = await terasliceClient.assets.list();
        } catch (err) {
            reply.fatal(`Error listing assets on ${cliConfig.args.clusterAlias}`);
        }
        display.display(header, response, cliConfig.args.output);
    }
} as CMD;
