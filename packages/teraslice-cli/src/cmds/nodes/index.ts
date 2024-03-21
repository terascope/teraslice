import { CMD } from '../../interfaces.js';
import list from './list.js';

export default {
    command: 'nodes <command>',
    describe: 'commands to list nodes',
    builder(yargs) {
        return yargs.command([list])
            .demandCommand(2);
    },
    handler: () => {}
} as CMD;
