import fs from 'fs';
import { CommandModule } from 'yargs';
import { toBoolean, castArray } from '@terascope/utils';
import { PackageInfo, GlobalCMDOptions } from '../helpers/interfaces.js';
import { getAvailableTestSuites } from '../helpers/misc.js';
import * as config from '../helpers/config.js';
import { listPackages } from '../helpers/packages.js';
import { runTests } from '../helpers/test-runner/index.js';
import { coercePkgArg } from '../helpers/args.js';

export type TestOptions = {
    debug: boolean;
    watch: boolean;
    bail: boolean;
    suite?: string[];
    'force-suite'?: string;
    'keep-open': boolean;
    'trace': boolean;
    'report-coverage': boolean;
    'elasticsearch-version': string;
    'elasticsearch-api-version': string;
    'kafka-version': string;
    'minio-version': string;
    'rabbitmq-version': string;
    'opensearch-version': string;
    'use-existing-services': boolean;
    packages?: PackageInfo[];
    'ignore-mount': boolean
};

const jestArgs = getExtraArgs();
const testSuites = getAvailableTestSuites();

const cmd: CommandModule<GlobalCMDOptions, TestOptions> = {
    command: 'test [packages..]',
    describe: 'Run monorepo tests',
    builder(yargs) {
        return yargs
            .example('$0 test', 'example --watch -- --testPathPattern worker-spec')
            .example('$0 test', 'example --debug --bail')
            .example('$0 test', '. --debug --bail')
            .example('$0 test', `. --trace --force-suite ${testSuites.find((s) => s.startsWith('unit'))}`)
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
            .option('elasticsearch-version', {
                description: 'The elasticsearch version to use',
                type: 'string',
                default: config.ELASTICSEARCH_VERSION,
            })
            .option('elasticsearch-api-version', {
                description: 'The elasticsearch client API version to use',
                type: 'string',
                default: config.ELASTICSEARCH_API_VERSION,
            })
            .option('kafka-version', {
                description: 'The kafka version to use',
                type: 'string',
                default: config.KAFKA_VERSION,
            })
            .option('minio-version', {
                description: 'The minio version to use',
                type: 'string',
                default: config.MINIO_VERSION,
            })
            .option('rabbitmq-version', {
                description: 'The rabbitmq version to use',
                type: 'string',
                default: config.RABBITMQ_VERSION,
            })
            .option('opensearch-version', {
                description: 'The opensearch version to use',
                type: 'string',
                default: config.OPENSEARCH_VERSION,
            })
            .option('ignore-mount', {
                description: 'If we should ignore configured mount',
                type: 'boolean',
                default: false,
            })
            .positional('packages', {
                description: 'Runs the test for one or more package, if none specified it will run all of the tests',
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
        const elasticsearchVersion = hoistJestArg(argv, 'elasticsearch-version', 'string');
        const elasticsearchAPIVersion = hoistJestArg(argv, 'elasticsearch-api-version', 'string');
        const kafkaVersion = hoistJestArg(argv, 'kafka-version', 'string');
        const minioVersion = hoistJestArg(argv, 'minio-version', 'string');
        const rabbitmqVersion = hoistJestArg(argv, 'rabbitmq-version', 'string');
        const opensearchVersion = hoistJestArg(argv, 'opensearch-version', 'string');
        const forceSuite = hoistJestArg(argv, 'force-suite', 'string');
        const ignoreMount = hoistJestArg(argv, 'ignore-mount', 'boolean');

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
            elasticsearchVersion,
            elasticsearchAPIVersion,
            kafkaVersion,
            minioVersion,
            rabbitmqVersion,
            opensearchVersion,
            all: !argv.packages || !argv.packages.length,
            reportCoverage,
            jestArgs,
            ignoreMount
        });
    },
};

type Arg = keyof TestOptions;
// this only works with booleans for now
function hoistJestArg(argv: any, keys: Arg|((Arg|string)[]), type: 'string'): string;
function hoistJestArg(argv: any, keys: Arg|((Arg|string)[]), type: 'boolean'): boolean;
function hoistJestArg(argv: any, keys: Arg|((Arg|string)[]), type: 'boolean'|'string'): boolean|string {
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
        return ['--testPathPattern', arg];
    }
    return [arg];
}

function getPkgInfos(packages?: PackageInfo[]): PackageInfo[] {
    if (packages && packages.length > 0) return packages;
    return listPackages();
}

export default cmd;
