import ms from 'ms';
import path from 'path';
import isCI from 'is-ci';
import fse from 'fs-extra';
import { ArgsMap, ExecEnv, dockerBuild, dockerPull, exec } from '../scripts';
import { debugLogger, get, TSError, isFunction } from '@terascope/utils';
import { TestOptions, GroupedPackages } from './interfaces';
import { PackageInfo, TestSuite } from '../interfaces';
import signale from '../signale';

const logger = debugLogger('ts-scripts:cmd:test');

export function getArgs(options: TestOptions): ArgsMap {
    const args: ArgsMap = {};
    args.forceExit = '';
    args.passWithNoTests = '';
    args.coverage = 'true';

    if (options.bail) {
        args.bail = '';
    }

    if (options.debug) {
        args.detectOpenHandles = '';
        args.coverage = 'false';
        args.runInBand = '';
    } else {
        args.silent = '';
    }

    if (options.suite === TestSuite.E2E) {
        args.runInBand = '';
        args.coverage = 'false';
        args.bail = '';
    }

    return args;
}

export function getEnv(options: TestOptions): ExecEnv {
    const defaults: ExecEnv = {
        ELASTICSEARCH_HOST: options.elasticsearchUrl,
        ELASTICSEARCH_VERSION: options.elasticsearchVersion,
        KAFKA_BROKER: options.kafkaBroker,
        KAFKA_VERSION: options.kafkaVersion,
    };

    if (!options.debug) return defaults;

    return {
        ...defaults,
        DEBUG: `${process.env.DEBUG},*teraslice*`,
    };
}

export function filterBySuite(pkgInfos: PackageInfo[], options: TestOptions): PackageInfo[] {
    if (!options.suite) return pkgInfos.slice();

    return pkgInfos.filter(pkgInfo => {
        const suite = pkgInfo.terascope.testSuite;
        if (!suite) {
            throw new Error(`Package ${pkgInfo.name} missing required "terascope.testSuite" configuration`);
        }
        if (suite === options.suite) {
            logger.info(`* found ${pkgInfo.name} for suite ${suite} to test`);
            return true;
        }
        const msg = `* skipping ${pkgInfo.name} ${suite} test`;
        if (!options.all) {
            signale.warn(msg);
        } else {
            logger.debug(msg);
        }
        return false;
    });
}

export function onlyUnitTests(pkgInfos: PackageInfo[]): boolean {
    return pkgInfos.some(pkgInfo => {
        return pkgInfo.terascope.testSuite === TestSuite.Unit;
    });
}

export function groupBySuite(pkgInfos: PackageInfo[]): GroupedPackages {
    const groups: GroupedPackages = {
        [TestSuite.Unit]: [],
        [TestSuite.Elasticsearch]: [],
        [TestSuite.Kafka]: [],
        [TestSuite.E2E]: [],
    };

    for (const pkgInfo of pkgInfos) {
        const suite = pkgInfo.terascope.testSuite || TestSuite.Disabled;
        if (suite === TestSuite.Disabled) continue;
        groups[suite].push(pkgInfo);
    }

    return groups;
}

export async function buildDockerImage(target: string): Promise<void> {
    const startTime = Date.now();
    signale.pending(`building docker image ${target}`);
    const cacheFrom = isCI ? ['node:10.16.0-alpine', 'terascope/teraslice:dev-base', 'terascope/teraslice:dev-connectors'] : [];
    if (cacheFrom.length) {
        logger.debug(`pulling images ${cacheFrom}`);
        await Promise.all(cacheFrom.map(dockerPull));
    }

    await dockerBuild(target, cacheFrom);
    signale.success(`built docker image ${target}, took ${ms(Date.now() - startTime)}`);
}

export async function globalTeardown(pkgs: { name: string; dir: string }[]) {
    for (const { name, dir } of pkgs) {
        const filePath = path.join(dir, 'test/global.teardown.js');
        if (fse.existsSync(filePath)) {
            signale.debug(`Running ${path.relative(process.cwd(), filePath)}`);
            try {
                const teardownFn = require(filePath);
                if (isFunction(teardownFn)) {
                    await teardownFn();
                }
            } catch (err) {
                signale.error(
                    new TSError(err, {
                        message: `Failed to teardown test for "${name}"`,
                    })
                );
            }
        }
    }
}

async function getE2ELogs(dir: string, env: ExecEnv): Promise<string> {
    const pkgJSON = await fse.readJSON(path.join(dir, 'package.json'));
    const hasLogsScript = Boolean(get(pkgJSON, 'scripts.logs'));
    if (hasLogsScript) {
        const result = await exec(
            {
                cmd: 'yarn',
                args: ['run', 'logs'],
                cwd: dir,
                env,
            },
            false
        );
        return result || '';
    }
    return '';
}

export async function logE2E(dir: string, failed: boolean): Promise<void> {
    if (failed) {
        const errLogs = await getE2ELogs(dir, {
            LOG_LEVEL: 'WARN',
            RAW_LOGS: 'false',
            FORCE_COLOR: '1',
        });
        process.stderr.write(`${errLogs}\n`);
    }

    const rawLogs = await getE2ELogs(dir, {
        RAW_LOGS: 'true',
    });

    const logFilePath = path.join(dir, './teraslice-test.log');
    if (!rawLogs) {
        await fse.remove(logFilePath);
        return;
    }

    await fse.writeFile(logFilePath, rawLogs);
    signale.debug(`Wrote e2e log files to ${path.relative(process.cwd(), logFilePath)}`);
}
