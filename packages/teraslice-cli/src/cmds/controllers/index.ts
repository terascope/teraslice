
import { CMD } from '../../interfaces';

export = {
    command: 'controllers <command>',
    describe: 'commands to manage controller',
    builder(yargs) {
        return yargs.strict()
            .commandDir('.')
            .demandCommand(2);
    },
    handler() {}
} as CMD;
