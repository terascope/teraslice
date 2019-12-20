import fs from 'fs';
import isCI from 'is-ci';
import { CommandModule } from 'yargs';
import { toBoolean, castArray } from '@terascope/utils';
import { PackageInfo, GlobalCMDOptions } from '../helpers/interfaces';
import { getAvailableTestSuites } from '../helpers/misc';
import * as config from '../helpers/config';
import { listPackages } from '../helpers/packages';
import { runTests } from '../helpers/test-runner';
import { coercePkgArg } from '../helpers/args';

type Options = {
    debug: boolean;
    watch: boolean;
    bail: boolean;
    suite?: string;
    'keep-open': boolean;
    'report-coverage': boolean;
    'elasticsearch-version': string;
    'elasticsearch-api-version': string;
    'kafka-version': string;
    'use-existing-services': boolean;
    packages?: PackageInfo[];
};

const jestArgs = getExtraArgs();

const cmd: CommandModule<GlobalCMDOptions, Options> = {
    command: 'test [packages..]',
    describe: 'Run monorepo tests',
    builder(yargs) {
        return yargs
            .example('$0 test', 'example --watch -- --testPathPattern worker-spec')
            .example('$0 test', 'example --debug --bail')
            .example('$0 test', '. --debug --bail')
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
            .option('suite', {
                alias: 's',
                description: 'Run a test given a particular suite. Defaults to running all',
                choices: getAvailableTestSuites(),
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
        const debug = hoistJestArg(argv, 'debug');
        const watch = hoistJestArg(argv, 'watch');
        const bail = hoistJestArg(argv, 'bail');
        if (debug && watch) {
            throw new Error('--debug and --watch conflict, please set one or the other');
        }

        return runTests(getPkgInfos(argv.packages), {
            debug,
            watch,
            bail,
            suite: argv.suite,
            keepOpen: argv['keep-open'],
            useExistingServices: argv['use-existing-services'],
            elasticsearchVersion: argv['elasticsearch-version'],
            elasticsearchAPIVersion: argv['elasticsearch-api-version'],
            kafkaVersion: argv['kafka-version'],
            all: !argv.packages || !argv.packages.length,
            reportCoverage: argv['report-coverage'],
            jestArgs,
        });
    },
};

// this only works with booleans for now
function hoistJestArg(argv: any, key: string): boolean {
    let val = argv[key];

    const index = jestArgs.indexOf(`--${key}`);
    if (index > -1) {
        const nextVal = jestArgs[index + 1];
        jestArgs.splice(index, 1);
        if (nextVal && ['true', true, 'false', false].includes(nextVal)) {
            val = toBoolean(nextVal);
        } else {
            val = true;
        }
    }

    return toBoolean(val);
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

export = cmd;
