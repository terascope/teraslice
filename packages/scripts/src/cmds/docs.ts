import { CommandModule } from 'yargs';
import { buildAll, buildPackage } from '../helpers/docs';
import { PackageInfo } from '../helpers/interfaces';
import { validatePkgName } from '../helpers/args';

const cmd: CommandModule = {
    command: 'docs [package]',
    describe: 'Update documentation for all packages or a specific package',
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
            return buildPackage(pkgInfo as PackageInfo);
        }
        return buildAll();
    },
};

export = cmd;
