import {
    debugLogger, chunk, TSError,
    isCI, pMap
} from '@terascope/utils';
import {
    writePkgHeader, writeHeader, getRootDir,
    getRootInfo, getAvailableTestSuites, getDevDockerImage,
} from '../misc';
import { ensureServices, pullServices } from './services';
import { PackageInfo } from '../interfaces';
import { TestOptions } from './interfaces';
import {
    createKindCluster,
    runJest,
    dockerTag,
    isKindInstalled,
    isKubectlInstalled,
    createNamespace,
    k8sSetup,
    loadTerasliceImage,
    destroyKindCluster,
} from '../scripts';
import {
    getArgs, filterBySuite, globalTeardown,
    reportCoverage, logE2E, getEnv,
    groupBySuite
} from './utils';
import signale from '../signale';
import {
    getE2EDir, readPackageInfo, listPackages, getE2eK8sDir
} from '../packages';
import { buildDevDockerImage } from '../publish/utils';
import { PublishOptions, PublishType } from '../publish/interfaces';
import { TestTracker } from './tracker';
import { MAX_PROJECTS_PER_BATCH, SKIP_DOCKER_BUILD_IN_E2E } from '../config';

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

            const teardownPkgs = pkgs.map((pkg) => ({
                name: pkg.name,
                dir: pkg.dir,
                suite: pkg.terascope.testSuite
            }));

            const cleanupKey = `${suite}:teardown:${pkgs.map((pkg) => pkg.folderName).join(',')}`;
            cleanupKeys.push(cleanupKey);
            tracker.addCleanup(cleanupKey, async () => {
                options.keepOpen = false;
                await globalTeardown(options, teardownPkgs);
            });

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
    console.log('options: ', options);
    tracker.expected++;

    const suite = 'e2e';
    let startedTest = false;

    const e2eDir = getE2EDir();
    if (!e2eDir) {
        throw new Error('Missing e2e test directory');
    }

    if (process.env.TEST_PLATFORM === 'kubernetes') {
        const e2eK8sDir = getE2eK8sDir();
        if (!e2eK8sDir) {
            throw new Error('Missing k8s e2e test directory');
        }
        const kindInstalled = await isKindInstalled();
        if (!kindInstalled) {
            signale.error('Please install Kind before running k8s tests. https://kind.sigs.k8s.io/docs/user/quick-start');
            process.exit(1);
        }

        const kubectlInstalled = await isKubectlInstalled();
        if (!kubectlInstalled) {
            signale.error('Please install kubectl before running k8s tests. https://kubernetes.io/docs/tasks/tools/');
            process.exit(1);
        }
        // TODO: pass kind config files in as variables
        // FIXME: error handling
        await createKindCluster(e2eK8sDir, 'kindConfig.yaml');
        await createNamespace(e2eK8sDir, 'ns.yaml');
        await k8sSetup(e2eK8sDir, 'role.yaml', 'roleBinding.yaml', 'priorityClass.yaml');
    }

    const rootInfo = getRootInfo();
    const e2eImage = `${rootInfo.name}:e2e`;

    if (isCI && process.env.TEST_PLATFORM === 'native') {
        // pull the services first in CI
        await pullServices(suite, options);
    }

    try {
        if (SKIP_DOCKER_BUILD_IN_E2E) {
            const devImage = `${getDevDockerImage()}-nodev${options.nodeVersion}`;
            await dockerTag(devImage, e2eImage);
        } else {
            const publishOptions: PublishOptions = {
                dryRun: true,
                nodeVersion: options.nodeVersion,
                type: PublishType.Dev
            };
            const devImage = await buildDevDockerImage(publishOptions);
            await dockerTag(devImage, e2eImage);
        }
    } catch (err) {
        tracker.addError(err);
    }

    if (process.env.TEST_PLATFORM === 'kubernetes') {
        await loadTerasliceImage(e2eImage); // FIXME: move to global.setup?
    }

    try {
        tracker.addCleanup(
            'e2e:services',
            await ensureServices(suite, options)
        );
    } catch (err) {
        tracker.addError(err);
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

    if (tracker.hasErrors()) {
        tracker.addCleanup('e2e:teardown', async () => {
            options.keepOpen = false;
            await globalTeardown(options, [{
                name: suite,
                dir: e2eDir,
                suite,
            }]);
        });
    }

    // if (process.env.TEST_PLATFORM === 'kubernetes') {
    //     await destroyKindCluster();
    // }
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

// async function runk8sE2ETest(
//     options: TestOptions, tracker: TestTracker
// ): Promise<void> {
//     console.log('options: ', options);
//     tracker.expected++;

//     const k8se2eDir = getK8SE2EDir();
//     if (!k8se2eDir) {
//         throw new Error('Missing k8se2e test directory');
//     }

//     const kindInstalled = await isKindInstalled();
//     if (!kindInstalled) {
//         signale.error('Please install Kind before running k8s tests. https://kind.sigs.k8s.io/docs/user/quick-start');
//         process.exit(1);
//     }

//     const kubectlInstalled = await isKubectlInstalled();
//     if (!kubectlInstalled) {
//         signale.error('Please install kubectl before running k8s tests. https://kubernetes.io/docs/tasks/tools/');
//         process.exit(1);
//     }
//     // TODO: pass kind config file in as a variable
//     await createKindCluster(k8se2eDir, 'kindConfig.yaml');

//     const suite = 'k8se2e';
//     let startedTest = false;

//     const rootInfo = getRootInfo();
//     const k8se2eImage = `${rootInfo.name}:k8se2e`;

//     // if (isCI) {
//     //     // pull the services first in CI
//     //     await pullServices(suite, options);
//     // }

//     try {
//         if (SKIP_DOCKER_BUILD_IN_E2E) {
//             const devImage = `${getDevDockerImage()}-nodev${options.nodeVersion}`;
//             await dockerTag(devImage, k8se2eImage);
//             await loadTerasliceImage(k8se2eImage);
//         } else {
//             const publishOptions: PublishOptions = {
//                 dryRun: true,
//                 nodeVersion: options.nodeVersion,
//                 type: PublishType.Dev
//             };
//             const devImage = await buildDevDockerImage(publishOptions);
//             await dockerTag(devImage, k8se2eImage);
//             await loadTerasliceImage(k8se2eImage);
//         }
//     } catch (err) {
//         tracker.addError(err);
//     }

// TODO: add tracker
// await createNamespace();
// await deployElasticSearch(k8se2eDir, 'elasticsearchDeployment.yaml');
// await k8sSetup(k8se2eDir, 'role.yaml', 'roleBinding.yaml', 'priorityClass.yaml');
// await deployk8sTeraslice(k8se2eDir, 'masterDeployment.yaml');
// await showState();

// await setAlias();
// await registerElasticsearchAssets();
// await registerStandardAssets();
// await registerTestJob();
// await startTestJob();

//     if (!tracker.hasErrors()) {
//         const timeLabel = `test suite "${suite}"`;
//         signale.time(timeLabel);
//         startedTest = true;

//         const env = printAndGetEnv(suite, options);

//         tracker.started++;
//         try {
//             await runJest(
//                 k8se2eDir,
//                 getArgs(options),
//                 env,
//                 options.jestArgs,
//                 options.debug
//             );
//             tracker.ended++;
//         } catch (err) {
//             tracker.ended++;
//             tracker.addError(err.message);
//         }

//         signale.timeEnd(timeLabel);
//     }

//     if (!startedTest) return;

//     if (!options.keepOpen) {
//         try {
//             await logE2E(k8se2eDir, tracker.hasErrors());
//         } catch (err) {
//             signale.error(
//                 new TSError(err, {
//                     reason: `Writing the "${suite}" logs failed`,
//                 })
//             );
//         }
//     }

//     if (tracker.hasErrors()) {
//         tracker.addCleanup('e2e:teardown', async () => {
//             options.keepOpen = false;
//             await globalTeardown(options, [{
//                 name: suite,
//                 dir: k8se2eDir,
//                 suite,
//             }]);
//         });
//     }
// }
