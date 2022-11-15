import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import reply from '../../helpers/reply.js';
import Jobs from '../../helpers/jobs.js';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    // TODO: is it [id] or <id>
    command: 'workers <cluster-alias> <id> <action> <number>',
    describe: 'Manage workers in job\n',
    builder(yargs: any) {
        yargs.positional('action', yargsOptions.buildPositional('worker-action'));
        yargs.positional('number', yargsOptions.buildPositional('worker-number'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.strict()
            .example('$0 jobs workers cluster1 99999999-9999-9999-9999-999999999999 add 5')
            .example('$0 jobs workers cluster1 99999999-9999-9999-9999-999999999999 remove 5');
        return yargs;
    },
    async handler(argv: any): Promise <void> {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);

        try {
            const response = await jobs.workers();
            reply.info(`> job: ${jobs.config.args.id}, ${response}`);
        } catch (e) {
            reply.fatal(e);
        }
    }
};

export default cmd;
