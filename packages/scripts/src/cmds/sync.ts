import { CommandModule } from 'yargs';
import { syncAll, syncPackage } from '../helpers/sync';
import { PackageInfo } from '../helpers/interfaces';
import { validatePkgName } from '../helpers/args';

const cmd: CommandModule = {
    command: 'sync [package]',
    describe: 'Sync packages to make sure they are up-to-date',
    builder(yargs) {
        return yargs
            .option('verify', {
                description: 'This will verify that all the files are synced. Defaults to true in CI',
                type: 'boolean',
                default: process.env.CI === 'true',
            })
            .positional('package', {
                description: 'Run scripts for particular package',
                coerce(arg) {
                    return validatePkgName(arg, false);
                },
            });
    },
    handler(argv) {
        const pkgInfo = argv.package as PackageInfo;
        const verify = Boolean(argv.verify);
        if (pkgInfo) {
            return syncPackage(pkgInfo, { verify });
        }
        return syncAll({ verify });
    },
};

export = cmd;
