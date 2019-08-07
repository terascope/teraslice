import isCI from 'is-ci';
import { CommandModule } from 'yargs';
import { syncAll, syncPackages } from '../helpers/sync';
import { PackageInfo } from '../helpers/interfaces';
import { coercePkgArg } from '../helpers/args';

const cmd: CommandModule = {
    command: 'sync [packages..]',
    describe: 'Sync packages to make sure they are up-to-date',
    builder(yargs) {
        return yargs
            .option('verify', {
                description: 'This will verify that all the files are synced. Defaults to true in CI',
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
    handler(argv) {
        const pkgInfos = argv.packages as PackageInfo[];
        const verify = Boolean(argv.verify);
        if (pkgInfos && pkgInfos.length) {
            return syncPackages(pkgInfos, { verify });
        }
        return syncAll({ verify });
    },
};

export = cmd;
