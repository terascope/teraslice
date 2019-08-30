import isCI from 'is-ci';
import { CommandModule } from 'yargs';
import { syncAll, syncPackages } from '../helpers/sync';
import { PackageInfo, GlobalCMDOptions } from '../helpers/interfaces';
import { coercePkgArg } from '../helpers/args';

type Options = {
    verify: boolean;
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
            .positional('packages', {
                description: 'Run scripts for one or more a package',
                type: 'string',
                coerce(arg) {
                    return coercePkgArg(arg);
                },
            });
    },
    handler({ packages, verify }) {
        if (packages && packages.length) {
            return syncPackages(packages, { verify });
        }
        return syncAll({ verify });
    },
};

export = cmd;
