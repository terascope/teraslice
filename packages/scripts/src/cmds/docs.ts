import { CommandModule } from 'yargs';
import { buildPackages } from '../helpers/doc-builder/index.js';
import { coercePkgArg } from '../helpers/args.js';
import { PackageInfo } from '../helpers/interfaces.js';
import { listPackages } from '../helpers/packages.js';

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
        return buildPackages(listPackages());
    },
};

export default cmd;
