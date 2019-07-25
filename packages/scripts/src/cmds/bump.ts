import { ReleaseType } from 'semver';
import { CommandModule } from 'yargs';
import { coercePkgArg } from '../helpers/args';
import { bumpPackages } from '../helpers/bump';
import { PackageInfo } from '../helpers/interfaces';

const cmd: CommandModule = {
    command: 'bump [packages..]',
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
                alias: 'deps',
                description: 'Bump all of the child dependencies to change, (if the child depedency is teraslice it will skip it)',
                default: false,
                type: 'boolean',
            })
            .option('release', {
                alias: 'r',
                description: 'Specify the release change for the version, see https://www.npmjs.com/package/semver',
                type: 'string',
                default: 'patch',
                requiresArg: true,
                choices: ['major', 'minor', 'patch', 'prerelease', 'premajor', 'preminor', 'prepatch'],
            })
            .positional('packages', {
                description: 'Run scripts for one or more package (if specifying more than one make sure they are ordered by dependants)',
                type: 'string',
                coerce(arg) {
                    return coercePkgArg(arg);
                },
            })
            .requiresArg(['packages']);
    },
    handler(argv) {
        return bumpPackages(argv.packages as PackageInfo[], {
            preId: argv['prelease-id'] as string | undefined,
            release: argv.release as ReleaseType,
            recursive: Boolean(argv.recursive),
        });
    },
};

export = cmd;
