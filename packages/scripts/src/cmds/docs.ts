import { CommandModule } from 'yargs';
import { buildAll, buildPackages } from '../helpers/docs';
import { coercePkgArg } from '../helpers/args';
import { PackageInfo } from '../helpers/interfaces';

const cmd: CommandModule = {
    command: 'docs [packages..]',
    describe: 'Update documentation for all packages or a specific package',
    builder(yargs) {
        return yargs.positional('packages', {
            description: 'Run scripts for one or more packages',
            type: 'string',
            coerce(arg) {
                return coercePkgArg(arg);
            },
        });
    },
    handler(argv) {
        const pkgInfos = argv.packages as PackageInfo[];
        if (pkgInfos && pkgInfos.length) {
            return buildPackages(pkgInfos);
        }
        return buildAll();
    },
};

export = cmd;
