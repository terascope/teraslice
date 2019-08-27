import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Reply from '../lib/reply';
import Jobs from '../../helpers/jobs';

const reply = new Reply();
const yargsOptions = new YargsOptions();

export = {
    // TODO: is it [id] or <id>
    command: 'workers <cluster-alias> <id> <action> <num>',
    describe: 'Manage workers in job\n',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.strict()
            .choices('action', ['add', 'remove'])
            .example('$0 jobs workers cluster1 99999999-9999-9999-9999-999999999999 add 5')
            .example('$0 jobs workers cluster1 99999999-9999-9999-9999-999999999999 remove 5');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);

        try {
            await jobs.workers();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
