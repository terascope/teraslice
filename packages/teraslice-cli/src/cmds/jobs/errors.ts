import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Jobs from '../../helpers/jobs';
import reply from '../../helpers/reply';

const yargsOptions = new YargsOptions();

export = {
    command: 'errors <cluster-alias> <job-id...>',
    describe: 'List errors for job or jobs on a cluster\n',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.strict()
            .example('$0 job errors cluster1 99999999-9999-9999-9999-999999999999')
            .example('$0 job errors cluster1 99999999-9999-9999-9999-999999999999 --from=500')
            .example('$0 job errors cluster1 99999999-9999-9999-9999-999999999999 --size=10')
            .example('$0 job errors cluster1 99999999-9999-9999-9999-999999999999 --sort=slicer_order:asc');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        try {
            await jobs.error();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
