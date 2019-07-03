import { CommandModule } from 'yargs';
import { syncAll, syncPackage } from '../helpers/sync';
import { PackageInfo } from '../helpers/interfaces';
import { validatePkgName } from '../helpers/args';

const cmd: CommandModule = {
    command: 'sync [package]',
    describe: 'Sync packages to make sure they are up-to-date',
    builder(yargs) {
        return yargs.positional('package', {
            description: 'Run scripts for particular package',
            coerce(arg) {
                return validatePkgName(arg, false);
            },
        });
    },
    handler(argv) {
        const pkgInfo = argv['package'];
        if (pkgInfo) {
            return syncPackage(pkgInfo as PackageInfo);
        }
        return syncAll();
    },
};

export = cmd;
