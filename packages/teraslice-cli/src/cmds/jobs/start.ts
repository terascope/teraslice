import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import Jobs from '../../helpers/jobs.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    // TODO: is it [id] or <id>
    command: 'start <cluster-alias> [id]',
    describe: 'starts all job on the specified in the saved state file \n',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('all', yargsOptions.buildOption('jobs-all'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.strict()
            .example('$0 jobs start cluster1 99999999-9999-9999-9999-999999999999')
            .example('$0 jobs start cluster1 99999999-9999-9999-9999-999999999999 --yes')
            .example('$0 jobs start cluster1 --all');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);

        try {
            await jobs.start();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
