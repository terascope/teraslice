import { pDelay, includes } from '@terascope/core-utils';
import { CMD } from '../../interfaces.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import TerasliceUtil from '../../helpers/teraslice-util.js';
import reply from '../../helpers/reply.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'stop <cluster-alias> <id>',
    describe: 'Stops ex_id that is running or failing on the cluster.\n',
    builder(yargs: any) {
        yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.options('output', yargsOptions.buildOption('output'));
        yargs.strict()
            .example('$0 ex stop cluster1 99999999-9999-9999-9999-999999999999');
        return yargs;
    },
    async handler(argv: any) {
        let response;
        const cliConfig = new Config(argv);
        const teraslice = new TerasliceUtil(cliConfig);

        let waitCountStop = 0;
        const waitMaxStop = 10;
        let stopTimedOut = false;

        while (!stopTimedOut) {
            if (waitCountStop >= waitMaxStop) {
                break;
            }
            try {
                response = await teraslice.client.executions.wrap(cliConfig.args.id).stop();
                stopTimedOut = true;
                if (response.status === 'stopped') {
                    reply.green(`> ex_id: ${cliConfig.args.id} stopped`);
                }
            } catch (err) {
                reply.error(`> Stopping ex_id had an error [${err.message}]`);
                if (includes(err.message, ' no active execution context was found')) {
                    stopTimedOut = true;
                } else {
                    stopTimedOut = false;
                }
            }

            await pDelay(500);
            waitCountStop += 1;
        }
    }
} as CMD;
