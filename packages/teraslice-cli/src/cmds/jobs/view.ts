import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Jobs from '../../helpers/jobs';

const yargsOptions = new YargsOptions();

export = {
    // TODO: is it [id] or <id>
    command: 'view <cluster-alias> <job-id...>',
    describe: 'View the job definition',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.strict()
            .example('$0 jobs view cluster1 99999999-9999-9999-9999-999999999999');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);

        const jobs = new Jobs(cliConfig);

        await jobs.initialize();

        await jobs.view();
    }
} as CMD;
