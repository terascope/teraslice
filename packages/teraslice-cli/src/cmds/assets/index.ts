
import { CMD } from '../../interfaces';

export default {
    command: 'assets <command>',
    describe: 'commands to manage assets',
    exclude: 'lib',
    builder(yargs) {
        return yargs.strict()
        .commandDir('.')
        .demandCommand(2);
    },
    handler () {}
} as CMD;
