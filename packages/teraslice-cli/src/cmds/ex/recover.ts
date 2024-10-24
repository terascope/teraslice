import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Executions from '../../helpers/executions.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'recover <cluster-alias> <id>',
    describe: 'Run recovery on cluster for specified execution id.\n',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.strict()
            .example('$0 ex recover cluster1 99999999-9999-9999-9999-999999999999');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);
        const executions = new Executions(cliConfig);

        try {
            await executions.recover();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
