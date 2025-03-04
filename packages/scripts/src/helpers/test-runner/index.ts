import {
    debugLogger, chunk, TSError,
    isCI, pMap
} from '@terascope/utils';
import path from 'node:path';
import { execa } from 'execa';
import {
    writePkgHeader, writeHeader, getRootDir,
    getRootInfo, getAvailableTestSuites, getDevDockerImage,
} from '../misc.js';
import {
    ensureServices, loadOrPullServiceImages,
    loadImagesForHelm
} from './services.js';
import { PackageInfo } from '../interfaces.js';
import { TestOptions } from './interfaces.js';
import {
    runJest, dockerTag, isKindInstalled, isKubectlInstalled,
    loadThenDeleteImageFromCache, deleteDockerImageCache,
    isHelmInstalled, isHelmfileInstalled, launchE2EWithHelmfile
} from '../scripts.js';
import { Kind } from '../kind.js';
import {
    getArgs, filterBySuite, reportCoverage,
    logE2E, getEnv, groupBySuite
} from './utils.js';
import signale from '../signale.js';
import { getE2EDir, readPackageInfo, listPackages } from '../packages.js';
import { buildDevDockerImage } from '../publish/utils.js';
import { PublishOptions, PublishType } from '../publish/interfaces.js';
import { TestTracker } from './tracker.js';
import {
    MAX_PROJECTS_PER_BATCH, SKIP_DOCKER_BUILD_IN_E2E, TERASLICE_PORT,
    BASE_DOCKER_IMAGE, K8S_VERSION, NODE_VERSION, ENCRYPT_MINIO, ENCRYPT_OPENSEARCH,
    MINIO_HOSTNAME,
    OPENSEARCH_HOSTNAME
} from '../config.js';
import { K8s } from '../k8s-env/k8s.js';

const logger = debugLogger('ts-scripts:cmd:test');

export async function runTests(pkgInfos: PackageInfo[], options: TestOptions): Promise<void> {
    const tracker = new TestTracker(options);
    const rootpkg = getRootInfo();
    let allpkgInfos: PackageInfo[] = pkgInfos;

    /// swap asset/package.json with top level package.json to support running asset tests
    /// TODO: This might be better to use jest.config within asset folder
    let runAssetTests = false;
    allpkgInfos.map((pkg) => {
        if (pkg.relativeDir === 'asset') {
            runAssetTests = true;
        }
        return;
    });
    if (rootpkg.terascope.asset && (listPackages() === allpkgInfos || runAssetTests)) {
        allpkgInfos = allpkgInfos.filter((pkg) => pkg.relativeDir !== 'asset');
        allpkgInfos = [...allpkgInfos, readPackageInfo(rootpkg.dir)];
    }

    logger.info('running tests with options', options);

    try {
        await _runTests(allpkgInfos, options, tracker);
    } catch (err) {
        tracker.addError(err);
    } finally {
        tracker.finish();
    }
}

async function _runTests(
    pkgInfos: PackageInfo[], options: TestOptions, tracker: TestTracker
): Promise<void> {
    if (options.suite?.includes('e2e')) {
        await runE2ETest(options, tracker);
        return;
    }

    const filtered = filterBySuite(pkgInfos, options);
    if (!filtered.length) {
        signale.warn('No tests found.');
        return;
    }

    const availableSuites = getAvailableTestSuites();
    const grouped = groupBySuite(filtered, availableSuites, options);

    for (const [suite, pkgs] of Object.entries(grouped)) {
        if (!pkgs.length || suite === 'e2e') continue;

        try {
            await runTestSuite(suite, pkgs, options, tracker);
            if (tracker.hasErrors()) {
                if (options.bail || isCI) {
                    break;
                }
            }
        } catch (err) {
            tracker.addError(err);
            break;
        }
    }
}

async function runTestSuite(
    suite: string,
    pkgInfos: PackageInfo[],
    options: TestOptions,
    tracker: TestTracker,
): Promise<void> {
    if (suite === 'e2e') return;

    if (isCI) {
        // load the services from cache in CI
        await loadOrPullServiceImages(suite, options.skipImageDeletion);
    }

    const CHUNK_SIZE = options.debug ? 1 : MAX_PROJECTS_PER_BATCH;

    if (options.watch && pkgInfos.length > MAX_PROJECTS_PER_BATCH) {
        throw new Error(
            `Running more than ${MAX_PROJECTS_PER_BATCH} packages will cause memory leaks`
        );
    }

    tracker.expected += pkgInfos.length;
    const chunked = chunk(pkgInfos, CHUNK_SIZE);

    // don't log unless this useful information (more than one package)
    if (chunked.length > 1 && chunked[0].length > 1) {
        writeHeader(`Running test suite "${suite}"`, false);
    }

    const cleanupKeys: string[] = [`${suite}:services`];

    tracker.addCleanup(
        `${suite}:services`,
        await ensureServices(options.forceSuite || suite, options)
    );

    const timeLabel = `test suite "${suite}"`;
    signale.time(timeLabel);

    const env = printAndGetEnv(suite, options);

    let chunkIndex = -1;
    for (const pkgs of chunked) {
        chunkIndex++;

        if (!pkgs.length) continue;
        if (pkgs.length === 1) {
            writePkgHeader('Running test', pkgs, false);
        } else {
            writeHeader(`Running batch of ${pkgs.length} tests`, false);
        }

        const args = getArgs(options);

        args.projects = pkgs.map(
            (pkgInfo) => {
                if (pkgInfo.relativeDir.length) {
                    return pkgInfo.relativeDir;
                }
                return '.';
            }
        );

        tracker.started += pkgs.length;
        try {
            await runJest(getRootDir(), args, env, options.jestArgs, options.debug);
            tracker.ended += pkgs.length;
        } catch (err) {
            tracker.ended += pkgs.length;
            tracker.addError(err.message);

            const cleanupKey = `${suite}:teardown:${pkgs.map((pkg) => pkg.folderName).join(',')}`;
            cleanupKeys.push(cleanupKey);

            if (options.bail || isCI) {
                signale.error('Bailing out of tests due to error');
                break;
            }
        } finally {
            if (options.reportCoverage) {
                await reportCoverage(suite, chunkIndex);
            }
        }
    }

    if (!options.keepOpen) {
        await pMap(cleanupKeys, (key) => tracker.runCleanupByKey(key));
    }

    signale.timeEnd(timeLabel);
}

async function runE2ETest(
    options: TestOptions, tracker: TestTracker
): Promise<void> {
    tracker.expected++;

    const suite = 'e2e';
    let startedTest = false;
    let kind;

    const e2eDir = getE2EDir();
    if (!e2eDir) {
        throw new Error('Missing e2e test directory');
    }

    // Dynamically generate any needed certs before any tests run
    await generateTestCaCerts();

    if (options.testPlatform === 'kubernetes' || options.testPlatform === 'kubernetesV2') {
        try {
            const kindInstalled = await isKindInstalled();
            if (!kindInstalled && !isCI) {
                signale.error('Please install Kind before running k8s tests. https://kind.sigs.k8s.io/docs/user/quick-start');
                process.exit(1);
            }

            const kubectlInstalled = await isKubectlInstalled();
            if (!kubectlInstalled && !isCI) {
                signale.error('Please install kubectl before running k8s tests. https://kubernetes.io/docs/tasks/tools');
                process.exit(1);
            }

            const helmInstalled = await isHelmInstalled();
            if (!helmInstalled && !isCI) {
                signale.error('Please install Helm before running k8s tests.https://helm.sh/docs/intro/install');
                process.exit(1);
            }

            const helmfileInstalled = await isHelmfileInstalled();
            if (!helmfileInstalled && !isCI) {
                signale.error('Please install helmfile before running k8s tests. https://helmfile.readthedocs.io/en/latest/#installation');
                process.exit(1);
            }

            kind = new Kind(K8S_VERSION, options.kindClusterName);
            try {
                if (isCI) {
                    await loadThenDeleteImageFromCache('kindest/node:v1.30.0', options.skipImageDeletion);
                }
                await kind.createCluster();
            } catch (err) {
                signale.error(err);
                await kind.destroyCluster();
                process.exit(1);
            }
            if (!options.useHelmfile) {
                const k8s = new K8s(TERASLICE_PORT, options.kindClusterName);
                await k8s.createNamespace('services-ns.yaml', 'services');
            }
        } catch (err) {
            tracker.addError(err);
        }
    }

    const rootInfo = getRootInfo();
    const e2eImage = `${rootInfo.name}:e2e-nodev${NODE_VERSION}`;

    if (isCI) {
        // load service if in native. In k8s services will be loaded directly to kind
        if (options.testPlatform === 'native') {
            await loadOrPullServiceImages(suite, options.skipImageDeletion);
        }

        // load the base docker image
        await loadThenDeleteImageFromCache(`${BASE_DOCKER_IMAGE}:${NODE_VERSION}`, options.skipImageDeletion);
    }

    try {
        if (SKIP_DOCKER_BUILD_IN_E2E) {
            const devImage = getDevDockerImage(NODE_VERSION);
            await dockerTag(devImage, e2eImage);
        } else {
            const publishOptions: PublishOptions = {
                dryRun: true,
                nodeSuffix: true,
                nodeVersion: NODE_VERSION,
                type: PublishType.Dev
            };
            const devImage = await buildDevDockerImage(publishOptions);
            await dockerTag(devImage, e2eImage);
        }
    } catch (err) {
        tracker.addError(err);
    }

    if (kind && (options.testPlatform === 'kubernetes' || options.testPlatform === 'kubernetesV2')) {
        try {
            await kind.loadTerasliceImage(e2eImage);
            if (options.useHelmfile) {
                const timeLabel = 'helmfile deployment';
                await loadImagesForHelm(options);
                signale.time(timeLabel);
                await launchE2EWithHelmfile();
                signale.timeEnd(timeLabel);
            }
        } catch (err) {
            tracker.addError(err);
        }
    }

    if (!options.useHelmfile) {
        try {
            tracker.addCleanup(
                'e2e:services',
                await ensureServices(suite, options)
            );
        } catch (err) {
            tracker.addError(err);
        }
    }

    if (!options.skipImageDeletion) {
        await deleteDockerImageCache();
    }

    if (!tracker.hasErrors()) {
        const timeLabel = `test suite "${suite}"`;
        signale.time(timeLabel);
        startedTest = true;

        const env = printAndGetEnv(suite, options);

        tracker.started++;
        try {
            await runJest(
                e2eDir,
                getArgs(options),
                env,
                options.jestArgs,
                options.debug
            );
            tracker.ended++;
        } catch (err) {
            tracker.ended++;
            tracker.addError(err.message);
        }

        signale.timeEnd(timeLabel);
    }

    if (!startedTest) return;

    if (!options.keepOpen) {
        try {
            await logE2E(e2eDir, tracker.hasErrors());
        } catch (err) {
            signale.error(
                new TSError(err, {
                    reason: `Writing the "${suite}" logs failed`,
                })
            );
        }
    }

    if ((options.testPlatform === 'kubernetes' || options.testPlatform === 'kubernetesV2')
        && !options.keepOpen && kind) {
        await kind.destroyCluster();
    }
}

function printAndGetEnv(suite: string, options: TestOptions) {
    const env = getEnv(options, suite);
    if (options.debug || options.trace || isCI) {
        const envStr = Object
            .entries(env)
            .filter(([_, val]) => val != null && val !== '')
            .map(([key, val]) => `${key}: "${val}"`)
            .join(', ');

        signale.debug(`Setting ${suite} test suite env to ${envStr}`);
    }
    return env;
}

/**
 * Generates CA certificates for encrypted services in the test environment if needed
 *
 * @throws {Error} If certificate generation fails.
 */
async function generateTestCaCerts(): Promise<void> {
    const encryptedServices: string[] = [];
    const hostNames: string[] = ['localhost'];
    if (ENCRYPT_OPENSEARCH) {
        encryptedServices.push('opensearch');
        hostNames.push(
            'opensearch2.services-dev1',
            'opensearch',
            OPENSEARCH_HOSTNAME
        );
    }
    if (ENCRYPT_MINIO) {
        encryptedServices.push('minio');
        hostNames.push(
            'minio.services-dev1',
            'minio',
            MINIO_HOSTNAME
        );
    }
    if (encryptedServices.length > 0) {
        // Formats the encrypted service list to print with the user feedback
        const serviceList = encryptedServices.length === 1 ? encryptedServices[0]
        : encryptedServices.length === 2 ? encryptedServices.join(' and ')
        : `${encryptedServices.slice(0, -1).join(', ')} and ${encryptedServices[encryptedServices.length - 1]}`;

        try {
            signale.pending(`Generating new ca-certificates for ${serviceList}...`);
            const scriptLocation = path.join(getE2EDir() as string, '../scripts/generate-cert.sh');

            // create a format array for each servie
            const formatCommands: string[] = [];
            encryptedServices.forEach((service) => {
                formatCommands.push('--format');
                formatCommands.push(service);
            });

            signale.debug('Generate certs command: ', `${scriptLocation} ${formatCommands.concat(hostNames)}`);
            await execa(scriptLocation, formatCommands.concat(hostNames));
        } catch (err) {
            throw new Error(`Error generating ca-certificates for ${serviceList}: ${err.message}`);
        }
    }
}
