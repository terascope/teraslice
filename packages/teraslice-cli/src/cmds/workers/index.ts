import { CMD } from '../../interfaces.js';
import list from './list.js';

export default {
    command: 'workers <command>',
    describe: 'commands to manage worker',
    exclude: 'lib',
    builder(yargs) {
        return yargs.command([list])
            .demandCommand(2);
    },
    handler: () => {}
} as CMD;
