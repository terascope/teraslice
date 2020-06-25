import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Jobs from '../../helpers/jobs';
import reply from '../lib/reply';

const yargsOptions = new YargsOptions();

export = {
    // TODO: is it [id] or <id>
    command: 'stop <cluster-alias> [id]',
    describe: 'stops job(s) running or failing on the cluster, saves running job(s) to a json file.\n',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('all', yargsOptions.buildOption('jobs-all'));
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

        try {
            await jobs.stop();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
