import { CommandModule } from 'yargs';
import { isCI } from '@terascope/utils';
import { syncAll, syncPackages } from '../helpers/sync';
import { PackageInfo, GlobalCMDOptions } from '../helpers/interfaces';
import { coercePkgArg } from '../helpers/args';

type Options = {
    verify: boolean;
    quiet?: boolean;
    packages?: PackageInfo[];
}

const cmd: CommandModule<GlobalCMDOptions, Options> = {
    command: 'sync [packages..]',
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
            })
            .positional('packages', {
                description: 'Run scripts for one or more a package',
                type: 'string',
                coerce(arg) {
                    return coercePkgArg(arg);
                },
            });
    },
    handler({ packages, verify, quiet }) {
        if (packages && packages.length) {
            return syncPackages(packages, { verify, quiet });
        }
        return syncAll({ verify, quiet });
    },
};

export = cmd;
