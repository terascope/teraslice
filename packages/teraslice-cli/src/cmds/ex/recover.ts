import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Executions from '../../helpers/executions';
import reply from '../../helpers/reply';

const yargsOptions = new YargsOptions();

export = {
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
