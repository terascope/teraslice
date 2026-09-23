import path from 'node:path';
import fs from 'node:fs';
import { Service } from '@terascope/types';
import { isCI, pRetry } from '@terascope/core-utils';
import { dockerTag, dockerBuild } from '../docker.js';
import {
    isHelmInstalled, isHelmfileInstalled, isKindInstalled,
    isKubectlInstalled, determineSearchHost, deletePersistentVolumeClaim
} from '../kubernetes.js';
import {
    launchTerasliceWithHelmfile, helmfileDestroy, launchTerasliceWithCustomHelmfile
} from '../helm.js';
import { generateTestCaCerts, generateCephCertsForConfigFile } from '../certs.js';
import { Kind } from '../kind.js';
import { K8sEnvOptions, CephRuntimeInfo } from './interfaces.js';
import signale from '../signale.js';
import {
    getDevDockerImage, getRootDir, getRootInfo,
    getConfigValueFromCustomYaml, setConfigValuesForCustomYaml
} from '../misc.js';
import { buildDevDockerImage } from '../publish/utils.js';
import { PublishOptions, PublishType } from '../publish/interfaces.js';
import config from '../config.js';
import { loadImagesForHelm, loadImagesForHelmFromConfigFile } from '../test-runner/services.js';

const rootInfo = getRootInfo();
const e2eImage = `${rootInfo.name}:e2e-nodev${config.NODE_VERSION}`;

export async function launchK8sEnv(options: K8sEnvOptions) {
    let repo: string = '';
    let tag: string = '';
    let imageName: string = '';
    let buildTerasliceImage: boolean = true;

    if (options.configFile) {
        signale.pending('Starting k8s environment with a config file..');

        // Encryption is not yet supported when launching with a custom config file,
        // except ceph (its certs are bootstrapped below, since the config-file path
        // bypasses generateHelmValuesFromServices where the other services inject).
        const encryptionValuePaths = [
            'opensearch2.ssl.enabled',
            'opensearch3.ssl.enabled',
            'kafka.ssl.enabled',
            'minio.tls.enabled',
            'valkey.tls.enabled'
        ];
        const encryptedServices: string[] = [];
        for (const valuePath of encryptionValuePaths) {
            const enabled = await getConfigValueFromCustomYaml(options.configFile, valuePath);
            if (enabled) {
                encryptedServices.push(valuePath.split('.')[0]);
            }
        }
        if (encryptedServices.length > 0) {
            signale.error(`Encryption is not supported when launching with a config file. Disable encryption for the following service(s): ${encryptedServices.join(', ')}`);
            process.exit(1);
        }

        // set the repo and tag to what's in the custom config to use later
        repo = await getConfigValueFromCustomYaml(options.configFile, 'teraslice.image.repository');
        tag = await getConfigValueFromCustomYaml(options.configFile, 'teraslice.image.tag');
        imageName = `${repo}:${tag}`;
        buildTerasliceImage = await getConfigValueFromCustomYaml(options.configFile, 'teraslice.image.build');
    } else {
        signale.pending('Starting k8s environment with the following options: ', options);
    }

    // Ceph is enabled either via TEST_CEPH (env-var path -> ENV_SERVICES) or via
    // `ceph.enabled` in a custom config file. Resolve it (and the S3 creds/store,
    // which must match what the teraslice s3 connector uses) up front so both the
    // node prep and the post-sync user creation fire in either path.
    const cephInfo = await resolveCephInfo(options.configFile);

    const kindInstalled = await isKindInstalled();
    if (!kindInstalled) {
        signale.error('Please install Kind before launching a k8s dev environment. https://kind.sigs.k8s.io/docs/user/quick-start');
        process.exit(1);
    }

    const helmfileInstalled = await isHelmfileInstalled();
    if (!helmfileInstalled && !isCI) {
        signale.error('Please install helmfile before running k8s tests. https://helmfile.readthedocs.io/en/latest/#installation');
        process.exit(1);
    }

    const kubectlInstalled = await isKubectlInstalled();
    if (!kubectlInstalled) {
        signale.error('Please install kubectl before launching a k8s dev environment. https://kubernetes.io/docs/tasks/tools/');
        process.exit(1);
    }

    if (!options.configFile) {
        await generateTestCaCerts();
    } else {
        await bootstrapConfigFileCephCerts(options.configFile, cephInfo);
    }

    signale.pending('Creating kind cluster');
    const kind = new Kind(config.K8S_VERSION, options.kindClusterName);
    try {
        await kind.createCluster(options.dev, options.configFile);
    } catch (err) {
        signale.error(err);
        // Do not destroy existing cluster if that was the cause of failure
        if (!err.message.includes('node(s) already exist for a cluster with the name')) {
            await kind.destroyCluster();
        }
        process.exit(1);
    }
    signale.success('Kind cluster created');

    // Ceph needs a raw block device for its OSD. Prepare a loop device + udev on
    // the node now, before the Rook cluster reconciles, so the OSD comes up on
    // the first pass. No-op unless Ceph is enabled.
    if (cephInfo.enabled) {
        try {
            await kind.prepNodeForCeph();
        } catch (err) {
            signale.error(err);
            await kind.destroyCluster();
            process.exit(1);
        }
    }

    try {
        if (!options.configFile || (buildTerasliceImage)) {
            await buildAndTagTerasliceImage(options);
        }

        if ((options.configFile && await getConfigValueFromCustomYaml(options.configFile, 'utility.enabled')) || process.env.ENABLE_UTILITY_SVC) {
            await buildUtilityImage();
        }
    } catch (err) {
        signale.fatal(err);
        if (!options.keepOpen) {
            await kind.destroyCluster();
        }
        process.exit(1);
    }

    signale.pending('Loading service images into kind cluster');
    if (options.configFile) {
        await loadImagesForHelmFromConfigFile(options.kindClusterName, options.configFile);
    } else {
        await loadImagesForHelm(options.kindClusterName, false);
    }
    signale.success('Service images loaded into kind cluster');

    signale.pending('Loading teraslice image into kind cluster');
    try {
        if (options.configFile) {
            if (!buildTerasliceImage) {
                await kind.loadTerasliceImage(imageName);
            } else {
                // We need to ensure the custom config has the image we are going to use set.
                const imageArray = e2eImage.split(':');
                await setConfigValuesForCustomYaml(options.configFile, 'teraslice.image.repository', imageArray[0]);
                signale.info(`Overwrote teraslice.image.repository field in custom config to "${imageArray[0]}"`);
                await setConfigValuesForCustomYaml(options.configFile, 'teraslice.image.tag', imageArray[1]);
                signale.info(`Overwrote teraslice.image.tag field in custom config to "${imageArray[1]}"`);
                await kind.loadTerasliceImage(e2eImage);
            }
        } else {
            await kind.loadTerasliceImage(e2eImage);
        }
    } catch (err) {
        signale.fatal(err);
        if (!options.keepOpen) {
            await kind.destroyCluster();
        }
        process.exit(1);
    }
    signale.success('Teraslice image loaded into kind cluster');

    try {
        signale.pending('Launching teraslice with helmfile');
        if (options.configFile) {
            await launchTerasliceWithCustomHelmfile(options.configFile, options.debug);
        } else {
            await launchTerasliceWithHelmfile(
                options.clusteringType, options.dev, options.logs, options.debug, false
            );
        }
        signale.success('Teraslice launched with helmfile');

        signale.pending('Ensuring Teraslice api is up...');
        await ensureTeraslice();
        signale.success('Teraslice api is up and running!');
    } catch (err) {
        signale.fatal('Error deploying Teraslice: ', err);
        if (!options.keepOpen) {
            signale.warn('Shutting down k8s cluster');
            await kind.destroyCluster();
        }
        process.exit(1);
    }

    signale.success(buildNextStepsMessage(kind, cephInfo, options));
}

/**
 * Resolve whether Ceph is enabled and the S3 identity to use. In config-file
 * mode these come from the yaml `ceph.*` block (which the teraslice s3 connector
 * also reads, so they match); otherwise from the env-var-driven config defaults.
 */
async function resolveCephInfo(configFile?: string): Promise<CephRuntimeInfo> {
    if (configFile) {
        const enabled = Boolean(await getConfigValueFromCustomYaml(configFile, 'ceph.enabled'));
        return {
            enabled,
            namespace: (await getConfigValueFromCustomYaml(configFile, 'ceph.namespace')) || config.CEPH_NAMESPACE,
            storeName: (await getConfigValueFromCustomYaml(configFile, 'ceph.storeName')) || config.CEPH_STORE_NAME,
            user: (await getConfigValueFromCustomYaml(configFile, 'ceph.user')) || config.CEPH_USER,
            accessKey: (await getConfigValueFromCustomYaml(configFile, 'ceph.accessKey')) || config.CEPH_ACCESS_KEY,
            secretKey: (await getConfigValueFromCustomYaml(configFile, 'ceph.secretKey')) || config.CEPH_SECRET_KEY,
            dashboardEnabled: Boolean(await getConfigValueFromCustomYaml(configFile, 'ceph.dashboard.enabled')),
        };
    }
    return {
        enabled: config.ENV_SERVICES.includes(Service.Ceph),
        namespace: config.CEPH_NAMESPACE,
        storeName: config.CEPH_STORE_NAME,
        user: config.CEPH_USER,
        accessKey: config.CEPH_ACCESS_KEY,
        secretKey: config.CEPH_SECRET_KEY,
        dashboardEnabled: false,
    };
}

/**
 * Config-file path: when ceph TLS is on but the certs are null/empty, mkcert a
 * keypair + CA and write them into the config file's ceph.tls.caCert/keypair.
 *
 * The env-var path injects these in generateHelmValuesFromServices, which a
 * custom config file bypasses (it's passed straight to helmfile). User-supplied
 * certs are left untouched. No-op unless ceph + ceph.tls are enabled.
 */
async function bootstrapConfigFileCephCerts(
    configFile: string, cephInfo: CephRuntimeInfo
): Promise<void> {
    if (!cephInfo.enabled) return;

    const tlsEnabled = Boolean(await getConfigValueFromCustomYaml(configFile, 'ceph.tls.enabled'));
    if (!tlsEnabled) return;

    const caCert = await getConfigValueFromCustomYaml(configFile, 'ceph.tls.caCert');
    const keypair = await getConfigValueFromCustomYaml(configFile, 'ceph.tls.keypair');
    if (caCert && keypair) {
        signale.info('Ceph TLS certs already present in config file; skipping generation');
        return;
    }

    signale.pending('Generating Ceph TLS certs for the config-file path...');
    const certs = await generateCephCertsForConfigFile(cephInfo.storeName, cephInfo.namespace);
    await setConfigValuesForCustomYaml(configFile, 'ceph.tls.caCert', certs.caCert);
    await setConfigValuesForCustomYaml(configFile, 'ceph.tls.keypair', certs.keypair);
    signale.success('Generated Ceph TLS certs and wrote them to the config file');
}

function buildNextStepsMessage(
    kind: Kind, cephInfo: CephRuntimeInfo, options: K8sEnvOptions
): string {
    const { deployedPorts } = kind;
    const tsPort = deployedPorts.teraslice;
    const { kindClusterName } = options;

    const lines: string[] = [
        'k8s environment ready.',
        'Next steps:',
        `\tAdd alias: teraslice-cli aliases add <cluster-alias> http://localhost:${tsPort}`,
        `\t\tExample: teraslice-cli aliases add cluster1 http://localhost:${tsPort}`,
        '\tLoad assets: teraslice-cli assets deploy <cluster-alias> <user/repo-name>',
        '\t\tExample: teraslice-cli assets deploy cluster1 terascope/elasticsearch-assets',
        '\tRegister a job: teraslice-cli tjm register <cluster-alias> <path/to/job/file.json>',
        '\t\tExample: teraslice-cli tjm reg cluster1 JOB.JSON',
        '\tStart a job: teraslice-cli tjm start <path/to/job/file.json>',
        '\t\tExample: teraslice-cli tjm start JOB.JSON',
        '\tDelete the kind k8s cluster: kind delete cluster --name <clusterName>',
        `\t\tExample: kind delete cluster --name ${kindClusterName}`,
        '\tSee the docs for more options: https://terascope.github.io/teraslice/docs/packages/teraslice-cli/overview',
        'Deployed service endpoints:',
        `\tTeraslice: http://localhost:${tsPort}`,
    ];

    if (deployedPorts.opensearch1 !== undefined) {
        lines.push(`\tOpenSearch 1: http://localhost:${deployedPorts.opensearch1}`);
    }
    if (deployedPorts.opensearch2 !== undefined) {
        lines.push(`\tOpenSearch 2: http://localhost:${deployedPorts.opensearch2}`);
    }
    if (deployedPorts.opensearch3 !== undefined) {
        lines.push(`\tOpenSearch 3: http://localhost:${deployedPorts.opensearch3}`);
    }
    if (deployedPorts.minioApi !== undefined) {
        lines.push(`\tMinio API: http://localhost:${deployedPorts.minioApi}`);
        lines.push(`\tMinio UI: http://localhost:${deployedPorts.minioUi}`);
    }
    if (deployedPorts.ceph !== undefined) {
        lines.push(`\tCeph S3 (host): http://localhost:${deployedPorts.ceph}  (path-style addressing)`);
        lines.push(`\tCeph S3 (in-cluster): http://rook-ceph-rgw-${cephInfo.storeName}.${cephInfo.namespace}.svc.cluster.local`);
        lines.push(`\tCeph S3 access key: ${cephInfo.accessKey}`);
        lines.push(`\tCeph S3 secret key: ${cephInfo.secretKey}`);
        lines.push(`\tCeph toolbox: kubectl -n ${cephInfo.namespace} exec -it deploy/rook-ceph-tools -- ceph status`);
        if (cephInfo.dashboardEnabled) {
            lines.push(`\tCeph dashboard (view buckets/users): https://localhost:${config.CEPH_DASHBOARD_PORT}  (self-signed; user: admin)`);
            lines.push(`\t\tPassword: kubectl -n ${cephInfo.namespace} get secret rook-ceph-dashboard-password -o jsonpath='{.data.password}' | base64 -d; echo`);
        } else {
            lines.push('\tCeph dashboard: disabled (set ceph.dashboard.enabled=true in your config to view buckets/users)');
        }
    }
    if (deployedPorts.kafka !== undefined) {
        lines.push(`\tKafka Broker: localhost:${deployedPorts.kafka}`);
    }
    if (deployedPorts.kafkaUi !== undefined) {
        lines.push(`\tKafka UI: http://localhost:${deployedPorts.kafkaUi}`);
    }

    return lines.join('\n');
}

/**
 * Hits the Teraslice API endpoint until it responds with a valid response
 * containing `teraslice_version`. Retries up to 10 times with exponential backoff.
 * Throws if the endpoint never becomes healthy.
 */
async function ensureTeraslice(): Promise<void> {
    await pRetry(async () => {
        const res = await fetch(`http://localhost:${config.TERASLICE_PORT}`);

        if (!res.ok) {
            throw new Error(`Failed to hit teraslice endpoint: ${res.status}`);
        }

        const data = await res.json();

        // Checking to see if it has 'teraslice_version key which it should always have.
        if (Object.keys(data).includes('teraslice_version')) {
            return;
        } else {
            throw new Error(`Teraslice endpoint returned an object that didn't have 'teraslice_version' as a key: ${data}`);
        }
        // Allow extra time: with s3 (Ceph) asset storage, teraslice must reach the
        // RGW and create its assets bucket before the API responds.
    }, { retries: 24, delay: 2000, backoff: 1.3, maxDelay: 15000 });
}

export async function rebuildTeraslice(options: K8sEnvOptions) {
    signale.time('Rebuild teraslice');

    const helmInstalled = await isHelmInstalled();
    if (!helmInstalled && !isCI) {
        signale.error('Please install Helm before running k8s tests. https://helm.sh/docs/intro/install');
        process.exit(1);
    }

    const kind = new Kind(config.K8S_VERSION, options.kindClusterName);

    signale.pending('Deleting Teraslice deployment');
    helmfileDestroy('teraslice');
    signale.success('Teraslice deployment successfully deleted');

    if (options.resetStore) {
        try {
            const searchHost = await determineSearchHost();
            signale.pending(`Reset-store option detected - deleting the ${searchHost} service`);
            await helmfileDestroy(searchHost);
            await deletePersistentVolumeClaim(searchHost);
            signale.success(`${searchHost} service successfully deleted`);
        } catch (err) {
            signale.error(`Failed to reset store:\n${err}`);
        }
    }

    try {
        await buildAndTagTerasliceImage(options);
    } catch (err) {
        signale.error(err);
        process.exit(1);
    }

    signale.pending('Loading Teraslice Docker image');
    try {
        if (options.configFile) {
            if (await getConfigValueFromCustomYaml(options.configFile, 'teraslice.image.build') === false) {
                signale.warn(`Your teraslice configuration at "teraslice.image.build" is set to false but you passed in --rebuild. Your image configured will be replaced with the default built image.`);
            }
            // We need to ensure the custom config has the image we are going to use set.
            const imageArray = e2eImage.split(':');
            await setConfigValuesForCustomYaml(options.configFile, 'teraslice.image.repository', imageArray[0]);
            signale.info(`Overwrote teraslice.image.repository field in custom config to "${imageArray[0]}"`);
            await setConfigValuesForCustomYaml(options.configFile, 'teraslice.image.tag', imageArray[1]);
            signale.info(`Overwrote teraslice.image.tag field in custom config to "${imageArray[1]}"`);
        }
        await kind.loadTerasliceImage(e2eImage);
    } catch (err) {
        signale.error(err);
        process.exit(1);
    }
    signale.success('Teraslice Docker image loaded');

    try {
        signale.pending('Launching rebuilt teraslice with helmfile');
        if (options.configFile) {
            await launchTerasliceWithCustomHelmfile(options.configFile, options.debug);
        } else {
            await launchTerasliceWithHelmfile(
                options.clusteringType, options.dev, options.logs, options.debug, false
            );
        }
        signale.pending('Rebuilt Teraslice launched with helmfile');
    } catch (err) {
        signale.error('Error re-deploying Teraslice: ', err);
        process.exit(1);
    }
    signale.timeEnd('Rebuild teraslice');
}

async function buildAndTagTerasliceImage(options: K8sEnvOptions) {
    let runImage;
    if (options.terasliceImage) {
        runImage = options.terasliceImage;
    } else if (options.skipBuild) {
        runImage = getDevDockerImage(config.NODE_VERSION);
    } else {
        try {
            const publishOptions: PublishOptions = {
                dryRun: true,
                nodeSuffix: true,
                nodeVersion: config.NODE_VERSION,
                type: PublishType.Dev,
                dockerFileName: options.dev ? 'Dockerfile.dev' : ''
            };
            runImage = await buildDevDockerImage(publishOptions);
        } catch (err) {
            throw new Error(`Teraslice Docker image build failed: ${err}`);
        }
    }

    try {
        await dockerTag(runImage, e2eImage);
    } catch (err) {
        throw new Error(`Failed to tag teraslice docker image ${runImage} as ${e2eImage}: ${err}`);
    }
}

async function buildUtilityImage() {
    try {
        const tag = `${config.UTILITY_SVC_DOCKER_IMAGE}:${config.UTILITY_SVC_VERSION}`;
        const dockerProjectPath = config.UTILITY_SVC_DOCKER_PROJECT_PATH;
        dockerBuild(tag, undefined, undefined, undefined, undefined, dockerProjectPath);
    } catch (err) {
        throw new Error(`Utility Service Docker image build failed: ${err}`);
    }
}

export function generateTemplateConfig() {
    const e2eHelmfileValuesPath = path.join(getRootDir(), 'packages/scripts/helm/values.yaml');
    const newFilePath = path.join(getRootDir(), 'k8s-config.yaml');

    if (fs.existsSync(newFilePath)) {
        throw new Error(`A config file has already exists at ${newFilePath}. Either delete it or rename it to generate a new config.`);
    }

    const file = fs.readFileSync(e2eHelmfileValuesPath, 'utf-8');
    fs.writeFileSync(newFilePath, file);
    signale.success(`Generated new templated config file at ${newFilePath}`);
}

export function listVersions() {
    signale.info(`\nk8sVersion: ${config.K8S_VERSION}\nkindVersion: ${config.KIND_VERSION}`);
}
