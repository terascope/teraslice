import { CommandModule } from 'yargs';
import { listPackages } from '../helpers/packages';
import { buildAll, buildPackage } from '../helpers/docs';

const cmd: CommandModule = {
    command: 'docs [package-name]',
    describe: 'Update documentation for all packages or a specific package',
    builder(yargs) {
        return yargs.positional('package-name', {
            description: 'Run scripts for particular package',
            choices: listPackages().map(({ folderName }) => folderName),
        });
    },
    handler(argv) {
        const packageName = argv['package-name'];
        if (packageName && typeof packageName === 'string') {
            return buildPackage(packageName);
        }
        return buildAll();
    },
};

export = cmd;
