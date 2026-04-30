import path from 'node:path';
import { createRequire } from 'node:module';
import {
    debugLogger, chunk, TSError,
    isCI, pMap
} from '@terascope/core-utils';
import { TestEnv } from '@terascope/types';
import fs from 'node:fs';
import {
    writePkgHeader, writeHeader, getRootDir,
    getRootInfo, getAvailableTestSuites, getDevDockerImage,
} from '../misc.js';
import {
    ensureServices, loadOrPullServiceImages,
    loadImagesForHelm,
} from './services.js';
import { PackageInfo } from '../interfaces.js';
import { TestFramework, TestOptions } from './interfaces.js';
import {
    dockerTag, isKindInstalled, isKubectlInstalled,
    loadThenDeleteImageFromCache, deleteDockerImageCache,
    isHelmInstalled, isHelmfileInstalled, launchTerasliceWithHelmfile,
    generateTestCaCerts, runTestFramework
} from '../scripts.js';
import { Kind } from '../kind.js';
import {
    filterBySuite, getArgs, getEnv, getTestFramework,
    groupByFrameworkSuite, logE2E
} from './utils.js';
import signale from '../signale.js';
import { getE2EDir, readPackageInfo, listPackages } from '../packages.js';
import { buildDevDockerImage } from '../publish/utils.js';
import { PublishOptions, PublishType } from '../publish/interfaces.js';
import { TestTracker } from './tracker.js';
import config from '../config.js';

const require = createRequire(import.meta.url);

const {
    MAX_PROJECTS_PER_BATCH, SKIP_DOCKER_BUILD_IN_E2E,
    K8S_VERSION, NODE_VERSION, ATTACH_JEST_DEBUGGER, CERT_PATH
} = config;

const logger = debugLogger('ts-scripts:cmd:test');

export async function runTests(pkgInfos: PackageInfo[], options: TestOptions): Promise<void> {
    const tracker = new TestTracker(options);
    const rootPkg = getRootInfo();
    let allPkgInfos: PackageInfo[] = pkgInfos;

    /// swap asset/package.json with top level package.json to support running asset tests
    /// TODO: This might be better to use jest.config within asset folder
    let runAssetTests = false;
    allPkgInfos.map((pkg) => {
        if (pkg.relativeDir === 'asset') {
            runAssetTests = true;
        }
        return;
    });
    if (rootPkg.terascope.asset && (listPackages() === allPkgInfos || runAssetTests)) {
        allPkgInfos = allPkgInfos.filter((pkg) => pkg.relativeDir !== 'asset');
        allPkgInfos = [...allPkgInfos, readPackageInfo(rootPkg.dir)];
    }

    logger.info('running tests with options', options);

    try {
        await _runTests(allPkgInfos, options, tracker);
    } catch (err) {
        tracker.addError(err);
    } finally {
        tracker.finish();
    }
}

async function _runTests(
    pkgInfos: PackageInfo[], options: TestOptions, tracker: TestTracker
): Promise<void> {
    // Dynamically generate any needed certs before any tests run
    await generateTestCaCerts();

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
    const frameworkGroups = groupByFrameworkSuite(filtered, availableSuites, options);

    for (const key in frameworkGroups) {
        const framework = key as TestFramework;
        if (!Object.hasOwn(frameworkGroups, framework)) continue;

        const grouped = frameworkGroups[framework];
        if (!grouped) continue;

        for (const [suite, pkgs] of Object.entries(grouped)) {
            if (!pkgs.length || suite === 'e2e') continue;

            try {
                await runTestSuite(suite, pkgs, options, tracker, framework);
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
}

async function runTestSuite(
    suite: string,
    pkgInfos: PackageInfo[],
    options: TestOptions,
    tracker: TestTracker,
    framework: TestFramework
): Promise<void> {
    if (suite === 'e2e') return;

    if (isCI) {
        // load the services from cache in CI
        await loadOrPullServiceImages(options.forceSuite || suite, options.skipImageDeletion);
    }

    const CHUNK_SIZE = options.debug ? 1 : MAX_PROJECTS_PER_BATCH;

    if (options.watch && pkgInfos.length > MAX_PROJECTS_PER_BATCH) {
        throw new Error(
            `Running more than ${MAX_PROJECTS_PER_BATCH} packages will cause memory leaks`
        );
    }

    const dynamicConfigPkgs: (PackageInfo & { configType: 'dynamic' | 'custom' })[] = [];
    const customConfigPkgs: (PackageInfo & { configType: 'dynamic' | 'custom' })[] = [];
    pkgInfos.forEach((_pkgInfo) => {
        const exists = fs.existsSync(`${_pkgInfo.dir}/${framework}.config.js`);

        const pkgInfo = _pkgInfo as PackageInfo & { configType: 'dynamic' | 'custom' };
        pkgInfo.configType = exists ? 'dynamic' : 'custom';

        const group = exists ? customConfigPkgs : dynamicConfigPkgs;
        group.push(pkgInfo);
    });

    tracker.expected += pkgInfos.length;
    const chunkedDynamic = chunk(dynamicConfigPkgs, CHUNK_SIZE);
    const chunkedCustom = chunk(customConfigPkgs, CHUNK_SIZE);
    const chunked = chunkedDynamic.concat(chunkedCustom);

    // don't log unless this useful information (more than one package)
    if (chunked.length > 1 && chunked[0].length > 1) {
        writeHeader(`Running test suite "${suite}"`, false);
    }

    const cleanupKeys: string[] = [`${suite}:services`];

    tracker.addCleanup(
        `${suite}:services`,
        await ensureServices(options.forceSuite || suite, options, path.join(process.cwd(), 'logs'))
    );

    const timeLabel = `test suite "${suite}"`;
    signale.time(timeLabel);

    const env = printAndGetEnv(suite, options);

    for (const pkgs of chunked) {
        if (!pkgs.length) continue;
        if (pkgs.length === 1) {
            writePkgHeader('Running test', pkgs, false);
        } else {
            writeHeader(`Running batch of ${pkgs.length} tests`, false);
        }

        const args = getArgs(options, framework);

        const dirs: string[] = [];
        args.projects = pkgs.map(
            (pkgInfo) => {
                dirs.push(pkgInfo.dir);
                if (pkgInfo.relativeDir.length) {
                    return pkgInfo.relativeDir;
                }
                return '.';
            }
        );

        // FIXME - we would need to do this at the chunk level instead, as we'd
        // have to separate pkgs that have a custom config to their own chunk,
        // and combine pkgs that don't into the jest config directories
        // FIXME - after researching, this may not work - I don't think
        // Playwright or Vitest accept a json string config like Jest does
        const rootDir = getRootDir();
        let testConfig: string | undefined;
        await pMap(dirs, async (dir) => {
            const exists = fs.existsSync(`${dir}/${framework}.config.js`);
            if (exists) return;

            const rootExists = fs.existsSync(`${rootDir}/${framework}.config.base.js`);
            if (!rootExists) return;

            function getModule(module: any) {
                if ('default' in module) return getModule(module.default);
                return module;
            }

            try {
                // const configFnPath = import.meta.url.includes('dist')
                //     ? '../../../../../../jest.config.base.js'
                //     : '../../../../../jest.config.base.js';
                const configFnPath = `${rootDir}/${framework}.config.base.js`;
                const makeConfig = getModule(require(configFnPath));
                const configObject = makeConfig(dir);
                testConfig = JSON.stringify(configObject);
            } catch (error) {
                console.error(`Error creating ${framework} config.`, error);
            }
        });
        console.error('==tra', testConfig);

        tracker.started += pkgs.length;

        try {
            await runTestFramework(
                rootDir,
                args,
                env,
                options.frameworkArgs,
                options.debug,
                ATTACH_JEST_DEBUGGER,
                framework,
                testConfig
            );
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
    const frameworks = getTestFramework(e2eDir);
    if (!e2eDir) {
        throw new Error('Missing e2e test directory');
    }

    if (options.clusteringType === 'kubernetesV2') {
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
                signale.error('Please install Helm before running k8s tests. https://helm.sh/docs/intro/install');
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
        } catch (err) {
            tracker.addError(err);
        }
    }

    const rootInfo = getRootInfo();
    const e2eImage = `${rootInfo.name}:e2e-nodev${NODE_VERSION}`;

    if (isCI) {
        // load service if in native. In k8s services will be loaded directly to kind
        if (options.clusteringType === 'native') {
            await loadOrPullServiceImages(suite, options.skipImageDeletion);
        }
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

    if (options.clusteringType === 'kubernetesV2') {
        try {
            if (!kind) {
                signale.error('Kind class was not created properly.');
                process.exit(1);
            }
            await kind.loadTerasliceImage(e2eImage);
            const timeLabel = 'helmfile deployment';
            await loadImagesForHelm(options.kindClusterName, options.skipImageDeletion);
            signale.time(timeLabel);
            await launchTerasliceWithHelmfile(
                options.clusteringType, false, options.logs, options.debug, true
            );
            signale.timeEnd(timeLabel);
        } catch (err) {
            tracker.addError(err);
        }
    }

    // 'native' is the default clusteringType. This block starts and logs docker services
    // via dockerRun. 'native' is a teraslice-specific clustering concept, and other
    // terafoundation apps that use ts-scripts don't have or may not have that concept.
    // so relying on it to mean "services are started via dockerRun" is not accurate for
    // all cases. The opposite is kubernetesV2, where services are deployed through helm
    // charts into a kind cluster and dockerRun is not used.
    // TODO: revisit this condition to more directly check whether services will be
    // started via dockerRun, rather than relying on the clustering type to imply it.
    if (options.clusteringType === 'native') {
        try {
            tracker.addCleanup(
                'e2e:services',
                await ensureServices(suite, options, path.join(e2eDir, 'logs'))
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
        for (const key of frameworks) {
            const framework = key as TestFramework;
            try {
                await runTestFramework(
                    e2eDir,
                    getArgs(options, framework),
                    env,
                    options.frameworkArgs,
                    options.debug,
                    ATTACH_JEST_DEBUGGER,
                    framework
                );
                tracker.ended++;
            } catch (err) {
                tracker.ended++;
                tracker.addError(err.message);
            }
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

    if (options.clusteringType === 'kubernetesV2' && !options.keepOpen && kind) {
        await kind.destroyCluster();
    }

    // Ensure the certs dir gets cleaned up
    if (fs.existsSync(CERT_PATH)) {
        fs.rmSync(CERT_PATH, { recursive: true, force: true });
    }
}

function printAndGetEnv(suite: string, options: TestOptions): TestEnv {
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
