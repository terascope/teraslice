import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import TerasliceUtil from '../../helpers/teraslice-util.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'status <cluster-alias> <id>',
    describe: 'Get the status of an execution id.\n',
    builder(yargs) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.strict()
            .example('$0 ex status cluster1 99999999-9999-9999-9999-999999999999', '');
        return yargs;
    },
    async handler(argv: any) {
        let response;
        const cliConfig = new Config(argv);
        const teraslice = new TerasliceUtil(cliConfig);

        try {
            response = await teraslice.client.executions.wrap(cliConfig.args.id).status();
        } catch (err) {
            reply.fatal(`Error getting ex_id:${cliConfig.args.id} on ${cliConfig.args.clusterAlias}\n${err}`);
        }

        // eslint-disable-next-line no-console
        console.log(JSON.stringify(response, null, 2));
    }
} as CMD;
