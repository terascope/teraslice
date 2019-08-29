import { CMD } from '../../interfaces';
import Config from '../../helpers/config';
import YargsOptions from '../../helpers/yargs-options';
import Jobs from '../../helpers/jobs';
import Reply from '../lib/reply';

const reply = new Reply();
const yargsOptions = new YargsOptions();

export = {
    command: 'pause <cluster-alias> [id]',
    describe: 'Pause job id on the specified cluster.\n',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.options('status', yargsOptions.buildOption('jobs-status'));
        yargs.options('all', yargsOptions.buildOption('jobs-all'));
        yargs.options('yes', yargsOptions.buildOption('yes'));
        yargs.strict()
            .example('$0 jobs pause cluster1 99999999-9999-9999-9999-999999999999')
            .example('$0 jobs pause cluster1 99999999-9999-9999-9999-999999999999 --yes')
            .example('$0 jobs pause cluster1 --all');
        return yargs;
    },
    async handler(argv: any) {
        const cliConfig = new Config(argv);
        const jobs = new Jobs(cliConfig);

        try {
            await jobs.pause();
        } catch (e) {
            reply.fatal(e);
        }
    }
} as CMD;
