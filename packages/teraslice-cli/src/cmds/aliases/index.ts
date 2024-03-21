import { CMD } from '../../interfaces.js';
import add from './add.js';
import list from './list.js';
import remove from './remove.js';
import update from './update.js';

export default {
    command: 'aliases <command>',
    describe: 'commands to add and remove cluster aliases',
    exclude: 'lib',
    builder: function builder(yargs) {
        return yargs.strict()
            .command([add, list, remove, update])
            .demandCommand(2);
    },
    handler: () => {}
} as CMD;
