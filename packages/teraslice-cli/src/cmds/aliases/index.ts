
import { CMD } from '../../interfaces';

export default {
    command: 'aliases <command>',
    describe: 'commands to add and remove cluster aliases',
    exclude: 'lib',
    builder: function builder(yargs) {
        return yargs.strict()
            .commandDir('.')
            .demandCommand(2);
    },
    handler: () => {}
} as CMD;
