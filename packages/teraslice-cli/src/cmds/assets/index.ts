import { CMD } from '../../interfaces.js';
import build from './build.js';
import deleteCmd from './delete.js';
import deploy from './deploy.js';
import init from './init.js';
import list from './list.js';

export default {
    command: 'assets <command>',
    describe: 'commands to manage assets',
    exclude: 'lib',
    builder(yargs) {
        return yargs.strict()
            .command([build, deleteCmd, deploy, init, list])
            .demandCommand(2);
    },
    handler() {}
} as CMD;
