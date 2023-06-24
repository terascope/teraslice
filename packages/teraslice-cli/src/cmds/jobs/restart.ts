import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Jobs from '../../helpers/jobs';
import reply from '../../helpers/reply';

const yargsOptions = new YargsOptions();

export = {
    // TODO: is it [id] or <id>
    command: 'restart <cluster-alias> <job-id...>',
    describe: 'Restart job id on the specified cluster.\n',
    builder(yargs: any) {
        yargs.positional('job-id', yargsOptions.buildPositional('job-id'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.strict()
            .example('$0 jobs restart cluster1 JOB_ID')
            .example('$0 jobs restart cluster1 JOB_ID1 JOB_ID2')
            .example('$0 jobs restart cluster1 JOB_ID --yes')
            .example('$0 jobs restart cluster1 all');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        try {
            await jobs.restart();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
