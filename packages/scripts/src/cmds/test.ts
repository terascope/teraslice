import isCI from 'is-ci';
import { CommandModule } from 'yargs';
import { runTests } from '../helpers/test-runner';
import { TestSuite, PackageInfo, GlobalCMDOptions } from '../helpers/interfaces';
import { coercePkgArg } from '../helpers/args';
import { listPackages } from '../helpers/packages';

type Options = {
    debug: boolean;
    bail: boolean;
    suite?: TestSuite;
    'elasticsearch-url': string;
    'elasticsearch-version': string;
    'kafka-broker': string;
    'kafka-version': string;
    packages?: PackageInfo[];
};

const jestArgs = getExtraArgs();

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
            .option('suite', {
                description: 'Run a test given a particular suite. Defaults to running all',
                choices: Object.values(TestSuite).filter(suite => suite !== TestSuite.Disabled),
                coerce(arg): TestSuite {
                    return arg;
                },
            })
            .option('elasticsearch-url', {
                description: 'The elasticsearch URL to use when needed (usually for --suite elasticsearch or e2e)',
                type: 'string',
                default: process.env.ELASTICSEARCH_HOST || 'http://localhost:9200/',
            })
            .option('elasticsearch-version', {
                description: 'The elasticsearch version to use',
                type: 'string',
                default: process.env.ELASTICSEARCH_VERSION || '6.8',
            })
            .option('kafka-broker', {
                description: 'The kafka brokers to use when needed (usually for --suite kafka or e2e)',
                type: 'string',
                default: process.env.KAFKA_BROKER || 'localhost:9092',
            })
            .option('kafka-version', {
                description: 'The kafka version to use',
                type: 'string',
                default: process.env.KAFKA_VERSION || '2.1',
            })
            .positional('packages', {
                description: 'Runs the test for one or more package, if none specified it will run all of the tests',
                coerce(arg) {
                    if (Array.isArray(arg)) {
                        arg.forEach((a, i) => {
                            if (!jestArgs.includes(a)) return;
                            arg.splice(i, 1);
                        });
                    }
                    return coercePkgArg(arg);
                },
            });
    },
    handler(argv) {
        return runTests(getPkgInfos(argv.packages), {
            debug: argv.debug,
            bail: argv.bail,
            suite: argv.suite,
            elasticsearchUrl: argv['elasticsearch-url'],
            elasticsearchVersion: argv['elasticsearch-version'],
            kafkaBroker: argv['kafka-broker'],
            kafkaVersion: argv['kafka-version'],
            all: !argv.packages || !argv.packages.length,
            jestArgs,
        });
    },
};

function getExtraArgs(): string[] {
    const args: string[] = [];
    let extra = false;
    process.argv.forEach(arg => {
        if (extra) args.push(arg);
        if (arg === '--') extra = true;
    });
    return args;
}

function getPkgInfos(packages?: PackageInfo[]): PackageInfo[] {
    if (packages && packages.length > 0) return packages;
    return listPackages();
}

export = cmd;
