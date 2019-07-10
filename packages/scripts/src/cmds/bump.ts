import { CommandModule } from 'yargs';
import { ReleaseType } from 'semver';
import { validatePkgName } from '../helpers/args';
import { bumpPackage } from '../helpers/bump';
import { PackageInfo } from '../helpers/interfaces';

const cmd: CommandModule = {
    command: 'bump <package> <release>',
    describe: 'Update a package to specific version and its dependencies. This should be run in the root of the workspace.',
    builder(yargs) {
        return yargs
            .example('$0', 'example major // 0.15.0 => 1.0.0')
            .example('$0', 'example minor // 0.5.0 => 0.6.0')
            .example('$0', 'example patch // 0.20.0 => 0.20.1')
            .example('$0', 'example premajor // 0.15.0 => 1.0.0-rc.0')
            .example('$0', 'example preminor // 0.5.0 => 0.6.0-rc.0')
            .example('$0', 'example prepatch // 0.20.0 => 0.20.1-rc.0')
            .example('$0', 'example prerelease // 0.20.1-rc.0 => 0.20.1-rc.1')
            .option('prelease-id', {
                default: 'rc',
                description: 'Specify the prerelease identifier, defaults to RC',
            })
            .option('recursive', {
                default: false,
                type: 'boolean',
                description: 'Bump all of the child dependencies to change, (if the child depedency is teraslice it will skip it)',
            })
            .positional('package', {
                description: 'Run scripts for particular package',
                coerce(arg) {
                    return validatePkgName(arg, true);
                },
            })
            .positional('release', {
                description: 'Specify the release change for the version, see https://www.npmjs.com/package/semver',
                choices: ['major', 'minor', 'patch', 'prerelease', 'premajor', 'preminor', 'prepatch'],
            })
            .requiresArg(['package', 'release']);
    },
    handler(argv) {
        return bumpPackage(argv.package as PackageInfo, {
            preId: argv['prelease-id'] as string | undefined,
            release: argv.release as ReleaseType,
            recursive: Boolean(argv.recursive),
        });
    },
};

export = cmd;
