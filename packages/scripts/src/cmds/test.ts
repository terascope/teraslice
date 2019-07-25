import isCI from 'is-ci';
import { CommandModule } from 'yargs';
import { runTests } from '../helpers/test-runner';
import { TestSuite, PackageInfo } from '../helpers/interfaces';
import { coercePkgArg } from '../helpers/args';
import { listPackages } from '../helpers/packages';

const cmd: CommandModule = {
    command: 'test [packages..]',
    describe: 'Run monorepo tests',
    builder(yargs) {
        return yargs
            .option('debug', {
                alias: 'd',
                description: 'This will run all of the tests in-band and output any debug info',
                type: 'boolean',
                default: false,
            })
            .option('bail', {
                description: 'This will cause the tests to stop at the first failed test.',
                type: 'boolean',
                default: isCI,
            })
            .option('filter', {
                alias: 'f',
                description: 'This will filter the tests by file pattern',
                type: 'string',
            })
            .option('suite', {
                alias: 's',
                description: 'Run a test given a particular suite. Defaults to running all',
                choices: Object.values(TestSuite).filter(suite => suite !== TestSuite.Disabled),
            })
            .positional('packages', {
                description: 'Runs the test for one or more package or test suite, if none specified it will run all of the tests',
                type: 'string',
                coerce(arg) {
                    return coercePkgArg(arg);
                },
            });
    },
    handler(argv) {
        const pkgInfos = getPkgInfos(argv);
        return runTests(pkgInfos, {
            debug: Boolean(argv.debug),
            bail: Boolean(argv.bail),
            suite: argv.suite as TestSuite,
            filter: argv.filter as string,
            all: isAll(argv),
        });
    },
};

function isAll(argv: any): boolean {
    return !argv.packages.length;
}

function getPkgInfos(argv: any): PackageInfo[] {
    if (argv.packages.length > 0) return argv.packages;
    return listPackages();
}

export = cmd;
