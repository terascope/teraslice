import isCI from 'is-ci';
import { CommandModule } from 'yargs';
import { runTests } from '../helpers/test-runner';
import { TestSuite, PackageInfo, GlobalCMDOptions } from '../helpers/interfaces';
import { coercePkgArg, makeArray } from '../helpers/args';
import { listPackages } from '../helpers/packages';

type Options = {
    debug: boolean;
    bail: boolean;
    filter?: string;
    suite?: TestSuite;
    'elasticsearch-url': string;
    'kafka-brokers': string;
    'service-version'?: string;
    packages?: PackageInfo[];
};

const cmd: CommandModule<GlobalCMDOptions, Options> = {
    command: 'test [packages..]',
    describe: 'Run monorepo tests',
    builder(yargs) {
        return yargs
            .option('debug', {
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
                description: 'This will filter the tests by file pattern',
                type: 'string',
            })
            .option('suite', {
                description: 'Run a test given a particular suite. Defaults to running all',
                choices: Object.values(TestSuite).filter(suite => suite !== TestSuite.Disabled),
                coerce(arg): TestSuite {
                    return arg;
                },
            })
            .option('service-version', {
                description: 'Suites may work for multiple version, specify the version here',
                type: 'string',
            })
            .option('elasticsearch-url', {
                description: 'The elasticsearch URL to use when needed (usually for --suite elasticsearch or e2e)',
                type: 'string',
                default: process.env.ELASTICSEARCH_URL || 'http://localhost:9200/',
            })
            .option('kafka-brokers', {
                description: 'The elasticsearch URL to use when needed (usually for --suite kafka or e2e)',
                type: 'string',
                default: process.env.KAFKA_BROKERS || 'localhost:9092',
            })
            .positional('packages', {
                description: 'Runs the test for one or more package or test suite, if none specified it will run all of the tests',
                coerce(arg) {
                    return coercePkgArg(arg);
                },
            });
    },
    handler(argv) {
        return runTests(getPkgInfos(argv.packages), {
            debug: argv.debug,
            bail: argv.bail,
            suite: argv.suite,
            filter: argv.filter,
            elasticsearchUrl: argv['elasticsearch-url'],
            serviceVersion: argv['service-version'],
            kafkaBrokers: parseBrokers(argv['kafka-brokers']),
            all: !argv.packages || !argv.packages.length,
        });
    },
};

function parseBrokers(arg: string): string[] {
    if (!arg) return [];
    return makeArray(arg.split(','));
}

function getPkgInfos(packages?: PackageInfo[]): PackageInfo[] {
    if (packages && packages.length > 0) return packages;
    return listPackages();
}

export = cmd;
