import fs from 'node:fs';
import { CommandModule } from 'yargs';
import { toBoolean, castArray } from '@terascope/utils';
import { PackageInfo, GlobalCMDOptions } from '../helpers/interfaces.js';
import { getAvailableTestSuites } from '../helpers/misc.js';
import * as config from '../helpers/config.js';
import { listPackages } from '../helpers/packages.js';
import { runTests } from '../helpers/test-runner/index.js';
import { coercePkgArg } from '../helpers/args.js';

type Options = {
    debug: boolean;
    watch: boolean;
    bail: boolean;
    suite?: string[];
    'force-suite'?: string;
    'keep-open': boolean;
    trace: boolean;
    'report-coverage': boolean;
    'use-existing-services': boolean;
    packages?: PackageInfo[];
    'ignore-mount': boolean;
    'test-platform': string;
    'skip-image-deletion': boolean;
    'use-helmfile': boolean;
};

const jestArgs = getExtraArgs();
const testSuites = getAvailableTestSuites();
const cmd: CommandModule<GlobalCMDOptions, Options> = {
    command: 'test [packages..]',
    describe: 'Run monorepo tests',
    builder(yargs) {
        return yargs
            .example('$0 test example --watch -- --testPathPatterns worker-spec', 'Run worker-spec test file within example package in watch mode.')
            .example('$0 test example --debug --bail', 'Run all tests in example package. Show debug info. Stop at first failed test.')
            .example('$0 test . --debug --bail', 'Run all tests in current directory. Show debug info. Stop at first failed test.')
            .example(`$0 test . --trace --force-suite ${testSuites.find((s) => s.startsWith('unit'))}`, 'Run a specific suite of tests in trace mode.')
            .example('$0 test asset --', 'Run asset tests only if within an asset repository.')
            .example('$0 test example asset --', 'Run example and asset tests.')
            .option('debug', {
                alias: 'd',
                description: 'This will run all of the tests in-band and output any debug info',
                type: 'boolean',
                default: false,
            })
            .option('trace', {
                description: 'Sets the debug log level to trace',
                type: 'boolean',
                default: false,
            })
            .option('bail', {
                description: 'This will cause the tests to stop at the first failed test.',
                type: 'boolean',
                default: false,
            })
            .option('keep-open', {
                description: 'This will cause the tests to remain open after done (so they can be debugged).',
                type: 'boolean',
                default: false,
            })
            .option('report-coverage', {
                description: 'Report the coverage for CI',
                type: 'boolean',
                default: config.REPORT_COVERAGE,
            })
            .option('watch', {
                alias: 'w',
                description: 'Run tests in an interactive watch mode, this will test only the changed files',
                type: 'boolean',
                default: false,
            })
            .option('force-suite', {
                description: 'Force a test to run with a specific test suite',
                choices: testSuites.filter((s) => s !== 'e2e'),
            })
            .option('suite', {
                alias: 's',
                description: 'Run a test given a particular suite. Defaults to running all',
                type: 'string',
                array: true,
                choices: testSuites,
            })
            .option('use-existing-services', {
                description: 'If true no services will be launched',
                type: 'boolean',
                default: config.USE_EXISTING_SERVICES,
            })
            .option('ignore-mount', {
                description: 'If we should ignore configured mount',
                type: 'boolean',
                default: false,
            })
            .option('test-platform', {
                description: 'Clustering platform for e2e tests',
                type: 'string',
                default: config.TEST_PLATFORM,
                choices: ['native', 'kubernetes', 'kubernetesV2']
            })
            .option('skip-image-deletion', {
                description: 'Skip the deletion of docker images from cache after loading into docker.\n This is useful if a CI job calls `ts-scripts test` more than once.',
                type: 'boolean',
                default: config.SKIP_IMAGE_DELETION,
            })
            .option('use-helmfile', {
                description: 'If true k8s tests will launch using helmfile, if false tests use kubectl and @kubernetes/client-node',
                type: 'boolean',
                default: config.USE_HELMFILE,
            })
            .positional('packages', {
                description: 'Runs the tests for one or more package and/or an asset, if none specified it will run all of the tests',
                coerce(arg) {
                    let args = castArray(arg);
                    args = args.filter((a) => {
                        if (!jestArgs.includes(a)) return true;
                        return false;
                    });
                    return coercePkgArg(args);
                },
            });
    },
    handler(argv) {
        const debug = hoistJestArg(argv, ['d', 'debug'], 'boolean');
        const watch = hoistJestArg(argv, ['w', 'watch'], 'boolean');
        const bail = hoistJestArg(argv, 'bail', 'boolean');
        const trace = hoistJestArg(argv, 'trace', 'boolean');
        const keepOpen = hoistJestArg(argv, 'keep-open', 'boolean');
        const reportCoverage = hoistJestArg(argv, 'report-coverage', 'boolean');
        const useExistingServices = hoistJestArg(argv, 'use-existing-services', 'boolean');
        const forceSuite = hoistJestArg(argv, 'force-suite', 'string');
        const ignoreMount = hoistJestArg(argv, 'ignore-mount', 'boolean');
        const testPlatform = hoistJestArg(argv, 'test-platform', 'string') as 'native' | 'kubernetes' | 'kubernetesV2';
        const kindClusterName = testPlatform === 'native' ? 'default' : 'k8s-e2e';
        const skipImageDeletion = hoistJestArg(argv, 'skip-image-deletion', 'boolean');
        const useHelmfile = hoistJestArg(argv, 'use-helmfile', 'boolean');

        if (debug && watch) {
            throw new Error('--debug and --watch conflict, please set one or the other');
        }

        return runTests(getPkgInfos(argv.packages), {
            debug,
            watch,
            bail,
            suite: argv.suite,
            trace,
            keepOpen,
            forceSuite,
            useExistingServices,
            all: !argv.packages || !argv.packages.length,
            reportCoverage,
            jestArgs,
            ignoreMount,
            clusteringType: testPlatform,
            kindClusterName,
            skipImageDeletion,
            useHelmfile
        });
    },
};

type Arg = keyof Options;
// this only works with booleans for now
function hoistJestArg(argv: any, keys: Arg|((Arg | string)[]), type: 'string'): string;
function hoistJestArg(argv: any, keys: Arg|((Arg | string)[]), type: 'boolean'): boolean;
function hoistJestArg(argv: any, keys: Arg|((Arg | string)[]), type: 'boolean' | 'string'): boolean | string {
    let val: any;

    castArray(keys).forEach((key) => {
        val = argv[key];

        const index = jestArgs.indexOf(
            key.length === 1 ? `-${key}` : `--${key}`
        );
        if (index > -1) {
            const nextVal = jestArgs[index + 1];

            if (type === 'boolean') {
                if (nextVal && ['true', true, 'false', false].includes(nextVal)) {
                    jestArgs.splice(index, 2);
                    val = toBoolean(nextVal);
                } else {
                    jestArgs.splice(index, 1);
                    val = true;
                }
            } else if (type === 'string') {
                jestArgs.splice(index, 2);
                val = nextVal;
            }
        }

        return toBoolean(val);
    });

    return val;
}

function getExtraArgs(): string[] {
    const args: string[] = [];
    let extra = false;
    process.argv.forEach((arg) => {
        if (extra) {
            args.push(...resolveJestArg(arg));
        }
        if (arg === '--') extra = true;
    });
    return args;
}

function resolveJestArg(arg: string): string[] {
    if (arg == null || arg === '') return [];
    if (fs.existsSync(arg)) {
        // for outside projects that have upgraded to jest 30 yet
        if (process.env.JEST_VERSION) {
            const parsed = process.env.JEST_VERSION?.split('.')[0];
            if (parsed != null) {
                const version = Number(parsed);
                if (version < 30) {
                    return ['--testPathPattern', arg];
                }
            }
        }

        return ['--testPathPatterns', arg];
    }
    return [arg];
}

function getPkgInfos(packages?: PackageInfo[]): PackageInfo[] {
    if (packages && packages.length > 0) return packages;
    return listPackages();
}

export default cmd;
