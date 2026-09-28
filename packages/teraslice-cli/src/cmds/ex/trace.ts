import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import TerasliceUtil from '../../helpers/teraslice-util.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'trace <cluster-alias> <id...>',
    describe: 'Request a slice trace for a running execution id.\n',
    builder(yargs) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('size', yargsOptions.buildOption('trace-size'));
        yargs.strict()
            .example('$0 ex trace cluster1 99999999-9999-9999-9999-999999999999', '')
            .example('$0 ex trace cluster1 99999999-9999-9999-9999-999999999999 --size 1', '')
            .example('$0 ex trace cluster1 99999999-9999-9999-9999-999999999999 --size all', '');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);

        if (cliConfig.args.id.length > 1) {
            throw new Error('Trace command only accepts one execution at a time.');
        }

        const [exId] = cliConfig.args.id;
        const teraslice = new TerasliceUtil(cliConfig);

        try {
            const response = await teraslice.client.executions
                .wrap(exId)
                .trace({ size: cliConfig.args.size });

            reply.info(JSON.stringify(response));
        } catch (err) {
            reply.fatal(`Error tracing ex ${exId} on ${cliConfig.args.clusterAlias}\n${err}`);
        }
    }
} as CMD;
