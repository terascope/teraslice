import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import TerasliceUtil from '../../helpers/teraslice-util.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';
import Display from '../../helpers/display.js';

const yargsOptions = new YargsOptions();
const display = new Display();

export default {
    command: 'tap <cluster-alias> <id...>',
    describe: 'Request a slice tap for a running execution id.\n',
    builder(yargs) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('size', yargsOptions.buildOption('tap-size'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.strict()
            .example('$0 ex tap cluster1 99999999-9999-9999-9999-999999999999', '')
            .example('$0 ex tap cluster1 99999999-9999-9999-9999-999999999999 --size 1', '')
            .example('$0 ex tap cluster1 99999999-9999-9999-9999-999999999999 --size all', '');
        return yargs;
    },
    async handler(argv) {
        const cliConfig = new Config(argv);

        if (cliConfig.args.id.length > 1) {
            throw new Error('Tap command only accepts one execution at a time.');
        }

        const [exId] = cliConfig.args.id;

        const confirmed = await display.confirmTap(
            cliConfig.args.size,
            `ex ${exId} on ${cliConfig.clusterUrl}`,
            cliConfig.args.yes
        );
        if (!confirmed) return;

        const teraslice = new TerasliceUtil(cliConfig);

        try {
            const response = await teraslice.client.executions
                .wrap(exId)
                .tap({ size: cliConfig.args.size });

            reply.info(JSON.stringify(response));
        } catch (err) {
            reply.fatal(`Error tapping ex ${exId} on ${cliConfig.args.clusterAlias}\n${err}`);
        }
    }
} as CMD;
