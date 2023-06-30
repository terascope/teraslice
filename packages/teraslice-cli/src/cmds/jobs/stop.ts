import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Jobs from '../../helpers/jobs';
import reply from '../../helpers/reply';

const yargsOptions = new YargsOptions();

export = {
    command: 'stop <cluster-alias> <job-id...>',
    describe: 'stops job(s) running or failing on the cluster, saves running job(s) to a json file.\n',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('save', yargsOptions.buildOption('jobs-save'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.strict()
            .example('$0 jobs stop cluster1 99999999-9999-9999-9999-999999999999')
            .example('$0 jobs stop cluster1 99999999-9999-9999-9999-999999999999 --yes')
            .example('$0 jobs stop cluster1 --all');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        try {
            await jobs.stop();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
