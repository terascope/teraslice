import { CommandModule } from 'yargs';
import { isCI } from '@terascope/core-utils';
import { syncAll } from '../helpers/sync/index.js';
import { GlobalCMDOptions } from '../helpers/interfaces.js';

type Options = {
    verify: boolean;
    quiet?: boolean;
};

const cmd: CommandModule<GlobalCMDOptions, Options> = {
    command: 'sync',
    describe: 'Sync packages to make sure they are up-to-date',
    builder(yargs) {
        return yargs
            .option('verify', {
                description: 'This will throw an error if out-of-sync. Defaults to true in CI',
                type: 'boolean',
                default: isCI,
            })
            .option('quiet', {
                alias: 'q',
                description: 'This will disable out-of-sync warnings',
                type: 'boolean',
                default: false,
            });
    },
    handler(args) {
        return syncAll({
            verify: args.verify,
            quiet: args.quiet
        });
    },
};

export default cmd;
