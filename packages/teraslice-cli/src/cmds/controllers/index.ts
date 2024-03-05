import { CMD } from '../../interfaces.js';
import list from './list.js';
import stats from './stats.js';

export default {
    command: 'controllers <command>',
    describe: 'commands to manage controller',
    builder(yargs) {
        return yargs.strict()
            .command([list, stats])
            .demandCommand(2);
    },
    handler() {}
} as CMD;
