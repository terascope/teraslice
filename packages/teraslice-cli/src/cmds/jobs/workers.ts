import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import reply from '../../helpers/reply';
import Jobs from '../../helpers/jobs';

const yargsOptions = new YargsOptions();

const cmd: CMD = {
    command: 'workers <cluster-alias> <action> <number> <job-id...>',
    describe: 'Manage workers in job\n',
    builder(yargs: any) {
        yargs.positional('action', yargsOptions.buildPositional('worker-action'));
        yargs.positional('number', yargsOptions.buildPositional('worker-number'));
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.strict()
            .example('$0 jobs workers cluster1 99999999-9999-9999-9999-999999999999 add 5')
            .example('$0 jobs workers cluster1 99999999-9999-9999-9999-999999999999 remove 5');
        return yargs;
    },
    async handler(argv: any): Promise <void> {
        const cliConfig = new Config(argv);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        try {
            await jobs.workers();
        } catch (e) {
            reply.fatal(e);
        }
    }
};

export = cmd;
