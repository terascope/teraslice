import { CMD } from '../../interfaces.js';
import add from './add.js';
import list from './list.js';
import migrateV2 from './migratev2.js';
import remove from './remove.js';
import update from './update.js';

export default {
    command: 'aliases <command>',
    describe: 'commands to add and remove cluster aliases',
    exclude: 'lib',
    builder: function builder(yargs) {
        return yargs.strict()
            .command([add, list, migrateV2, remove, update])
            .demandCommand(2);
    },
    handler: () => {}
} as CMD;
